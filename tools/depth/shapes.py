"""Hand-placed shapes in full-resolution (3000px) cover coordinates."""

# Inner area of each dragon eye (inside the dark outline), closed by the blink lid.
DRAGON_EYES = [
    [(1679, 721), (1712, 748), (1737, 792), (1727, 826), (1668, 822), (1652, 760)],
    [(1992, 765), (2025, 785), (2036, 815), (2010, 856), (1982, 835), (1975, 790)],
]

# Light-catching areas of each guitar: body plus neck.
GUITARS = {
    "the-ladder": [
        [
            (992, 2195),
            (1090, 2215),
            (1238, 2235),
            (1269, 2362),
            (1285, 2500),
            (1246, 2577),
            (1115, 2646),
            (1015, 2608),
            (992, 2423),
        ],
        [(1158, 1562), (1200, 1562), (1190, 2210), (1131, 2210)],
    ],
    "flight-of-the-white-dragon": [
        [
            (2322, 2333),
            (2422, 2422),
            (2389, 2522),
            (2322, 2611),
            (2222, 2622),
            (2200, 2567),
            (2222, 2511),
            (2289, 2456),
        ],
        [(2590, 2000), (2620, 2005), (2385, 2425), (2350, 2430)],
    ],
}

# Sparkle positions on the glasses.
GLASSES = {
    "the-ladder": (895, 848),
    "flight-of-the-white-dragon": (2300, 1612),
}
