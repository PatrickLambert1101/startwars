from pathlib import Path
import subprocess,tempfile,shutil
root=Path(__file__).resolve().parents[1]
pg_tools={name:shutil.which(name) for name in ['initdb','pg_ctl','psql']}
if not all(pg_tools.values()): raise SystemExit('PostgreSQL initdb, pg_ctl and psql must be on PATH.')
setup="""
CREATE TABLE animals(id text PRIMARY KEY,status text,vaccinations_up_to_date boolean NOT NULL,notes text);
CREATE FUNCTION sync_push(changes jsonb) RETURNS jsonb LANGUAGE plpgsql AS $fn$
DECLARE rec jsonb;
BEGIN
 FOR rec IN SELECT * FROM jsonb_array_elements(COALESCE(changes->'animals'->'created','[]'::jsonb) || COALESCE(changes->'animals'->'updated','[]'::jsonb)) LOOP
  INSERT INTO animals(id, status, vaccinations_up_to_date, notes) VALUES (
   rec->>'id', rec->>'status', COALESCE((rec->>'vaccinations_up_to_date')::boolean, false), rec->>'notes')
  ON CONFLICT(id) DO UPDATE SET status=EXCLUDED.status,
   vaccinations_up_to_date = EXCLUDED.vaccinations_up_to_date, notes=EXCLUDED.notes;
 END LOOP;
 RETURN jsonb_build_object('success',true);
END $fn$;
CREATE FUNCTION sync_pull(last_pulled_at bigint,client_schema_version integer) RETURNS jsonb LANGUAGE plpgsql AS $fn$
DECLARE changes jsonb; rows jsonb; timestamp_now bigint:=1000;
BEGIN
 SELECT COALESCE(jsonb_agg(jsonb_build_object('id',id,'status',status,'vaccinations_up_to_date',vaccinations_up_to_date,'notes',notes) ORDER BY id),'[]'::jsonb) INTO rows FROM animals;
 changes:=jsonb_build_object('animals',jsonb_build_object('created',rows,'updated',rows,'deleted','[]'::jsonb));
 RETURN jsonb_build_object('changes', changes, 'timestamp', timestamp_now);
END $fn$;
INSERT INTO animals VALUES('legacy','active',true,'Existing data');
"""
checks="""DO $test$
DECLARE payload jsonb; result jsonb; change_kind text;
BEGIN
 IF (SELECT vaccination_history FROM animals WHERE id='legacy') IS NOT NULL THEN RAISE EXCEPTION 'Existing history was rewritten'; END IF;
 payload:='{"id":"new","status":"active","vaccinations_up_to_date":true,"vaccination_history":"unknown"}'::jsonb;
 PERFORM sync_push(jsonb_build_object('animals',jsonb_build_object('created',jsonb_build_array(payload))));
 IF (SELECT vaccination_history FROM animals WHERE id='new') IS DISTINCT FROM 'unknown' THEN RAISE EXCEPTION 'Unknown was not persisted'; END IF;
 result:=sync_pull(0,25);
 FOREACH change_kind IN ARRAY ARRAY['created','updated'] LOOP
  IF NOT (result #> ARRAY['changes','animals',change_kind,'1']) ? 'vaccination_history' THEN RAISE EXCEPTION 'New client missing field'; END IF;
  IF result #>> ARRAY['changes','animals',change_kind,'1','vaccination_history'] IS DISTINCT FROM 'unknown' THEN RAISE EXCEPTION 'New client value incorrect'; END IF;
 END LOOP;
 result:=sync_pull(0,24);
 IF (result #> '{changes,animals,created,1}') ? 'vaccination_history' THEN RAISE EXCEPTION 'Older client received unknown column'; END IF;
 PERFORM sync_push(jsonb_build_object('animals',jsonb_build_object('updated',jsonb_build_array(payload-'vaccination_history'))));
 IF (SELECT vaccination_history FROM animals WHERE id='new') IS DISTINCT FROM 'unknown' THEN RAISE EXCEPTION 'Older client erased explicit history'; END IF;
 payload:=(payload-'vaccination_history') || '{"vaccinations_up_to_date":false}'::jsonb;
 PERFORM sync_push(jsonb_build_object('animals',jsonb_build_object('updated',jsonb_build_array(payload))));
 IF (SELECT vaccination_history FROM animals WHERE id='new') IS NOT NULL THEN RAISE EXCEPTION 'Older client choice did not supersede history'; END IF;
 payload:=payload || '{"vaccination_history":"current","vaccinations_up_to_date":true}'::jsonb;
 PERFORM sync_push(jsonb_build_object('animals',jsonb_build_object('updated',jsonb_build_array(payload))));
 IF (SELECT vaccination_history FROM animals WHERE id='new') IS DISTINCT FROM 'current' THEN RAISE EXCEPTION 'Explicit current not saved'; END IF;
 BEGIN
  UPDATE animals SET vaccination_history='invented';
  RAISE EXCEPTION 'Invalid status accepted';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
 IF (SELECT notes FROM animals WHERE id='legacy') <> 'Existing data' THEN RAISE EXCEPTION 'Other data changed'; END IF;
END $test$;
"""
folder=Path(tempfile.mkdtemp(prefix='herd-history-pg-'));data=folder/'data'
def run(args,**kwargs): return subprocess.run(args,check=True,**kwargs)
run([pg_tools['initdb'],'-D',str(data),'-A','trust','--no-locale'],stdout=subprocess.DEVNULL)
started=False
try:
 run([pg_tools['pg_ctl'],'-D',str(data),'-l',str(folder/'server.log'),'-o',f"-k {folder} -p 55449 -c listen_addresses=''",'start'],stdout=subprocess.DEVNULL);started=True
 migration=(root/'supabase/migrations/20261028103000_add_vaccination_history.sql').read_text()
 run([pg_tools['psql'],'-h',str(folder),'-p','55449','-d','postgres','-v','ON_ERROR_STOP=1'],input=setup+'\n'+migration+'\n'+checks+'\n'+migration,text=True,stdout=subprocess.DEVNULL)
 print('History migration passed: preserves legacy data, persists Unknown/Current, supports old and new pulls, protects history from older clients, accepts intentional older-client changes, rejects invalid states, and reapplies safely.')
finally:
 if started: run([pg_tools['pg_ctl'],'-D',str(data),'stop','-m','fast'],stdout=subprocess.DEVNULL)

 shutil.rmtree(folder,ignore_errors=True)
