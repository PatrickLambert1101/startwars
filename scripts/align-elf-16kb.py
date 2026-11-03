#!/usr/bin/env python3
"""Repack a little-endian ELF64 shared library for 16 KB LOAD alignment."""

from __future__ import annotations

import argparse
import struct
from pathlib import Path

ELF_HEADER = struct.Struct("<16sHHIQQQIHHHHHH")
PROGRAM_HEADER = struct.Struct("<IIQQQQQQ")
SECTION_HEADER = struct.Struct("<IIQQQQIIQQ")
PT_LOAD = 1


def align_library(source: Path, destination: Path, page_size: int) -> None:
    original = source.read_bytes()
    header = list(ELF_HEADER.unpack_from(original))
    ident = header[0]
    if ident[:4] != b"\x7fELF" or ident[4] != 2 or ident[5] != 1:
        raise ValueError("Only little-endian ELF64 files are supported")

    phoff, shoff = header[5], header[6]
    phentsize, phnum = header[9], header[10]
    shentsize, shnum = header[11], header[12]
    if phentsize != PROGRAM_HEADER.size or shentsize != SECTION_HEADER.size:
        raise ValueError("Unexpected ELF header sizes")

    program_headers = [
        list(PROGRAM_HEADER.unpack_from(original, phoff + index * phentsize))
        for index in range(phnum)
    ]
    section_headers = [
        list(SECTION_HEADER.unpack_from(original, shoff + index * shentsize))
        for index in range(shnum)
    ]

    insertions: list[tuple[int, int]] = []
    cumulative_padding = 0
    for program in sorted(
        (item for item in program_headers if item[0] == PT_LOAD), key=lambda item: item[2]
    ):
        original_offset, virtual_address = program[2], program[3]
        shifted_offset = original_offset + cumulative_padding
        padding = (virtual_address - shifted_offset) % page_size
        if padding:
            insertions.append((original_offset, padding))
            cumulative_padding += padding

    def shift_for(original_offset: int) -> int:
        return sum(size for insertion_offset, size in insertions if original_offset >= insertion_offset)

    rebuilt = bytearray(original)
    inserted = 0
    for original_offset, size in insertions:
        rebuilt[original_offset + inserted : original_offset + inserted] = b"\0" * size
        inserted += size

    new_phoff = phoff + shift_for(phoff)
    new_shoff = shoff + shift_for(shoff)
    header[5] = new_phoff
    header[6] = new_shoff
    ELF_HEADER.pack_into(rebuilt, 0, *header)

    for index, program in enumerate(program_headers):
        program[2] += shift_for(program[2])
        if program[0] == PT_LOAD:
            program[7] = max(program[7], page_size)
            if program[2] % page_size != program[3] % page_size:
                raise ValueError("Unable to produce congruent LOAD segment alignment")
        PROGRAM_HEADER.pack_into(rebuilt, new_phoff + index * phentsize, *program)

    for index, section in enumerate(section_headers):
        section[4] += shift_for(section[4])
        SECTION_HEADER.pack_into(rebuilt, new_shoff + index * shentsize, *section)

    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(rebuilt)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    parser.add_argument("--page-size", type=int, default=16_384)
    args = parser.parse_args()
    align_library(args.source, args.destination, args.page_size)


if __name__ == "__main__":
    main()
