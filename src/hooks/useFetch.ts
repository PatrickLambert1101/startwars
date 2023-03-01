import { useRef, useReducer, useEffect, Reducer } from "react";
import { Person } from "../components/SearchBar";
export type Status = 'FETCHING' | 'FETCHED' | 'ERROR' | 'IDLE'
type State = {
	status?: string,
	error?: string | null,
	data?: Person[]
}
type Action = { type: 'FETCHING' } | { type: 'FETCHED', payload: Person[] } | { type: 'FETCH_ERROR', payload: string }
export const useFetch = (url: string, numberOfChars: number) => {
	console.log("🚀 ~ useFetch ~ numberOfChars:", numberOfChars)
	const cache = useRef<{ current?: string[] }>({});

	const initialState: State = {
		status: 'IDLE' as Status,
		error: null,
		data: [],
	};

	const [state, dispatch] = useReducer((state: State, action: Action) => {
		switch (action.type) {
		  case 'FETCHING':
			return { ...initialState, status: 'FETCHING' };
		  case 'FETCHED':
			return { ...initialState, status: 'FETCHED', data: action.payload };
		  case 'FETCH_ERROR':
			return { ...initialState, status: 'ERROR', error: action.payload };
		  default:
			return state;
		}
	  } , initialState);

	useEffect(() => {
		let cancelRequest = false;
		if (!url || !url.trim() || numberOfChars < 2) return;

		const fetchData = async () => {
			dispatch({ type: 'FETCHING' });
			if (cache.current[url]) {
				const data = cache.current[url];
				dispatch({ type: 'FETCHED', payload: data.results });
			} else {
				try {
					const response = await fetch(url);
					const data = await response.json();
					cache.current[url] = data;
					if (cancelRequest) return;
					dispatch({ type: 'FETCHED', payload: data.results });
				} catch (error) {
					if (cancelRequest) return;
					dispatch({ type: 'FETCH_ERROR', payload: error.message });
				}
			}
		};

		fetchData();

		return function cleanup() {
			cancelRequest = true;
		};
	}, [url, numberOfChars]);

	return state;
};