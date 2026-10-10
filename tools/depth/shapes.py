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

# --- Flight layers, in 1000px cover coordinates. Depth gives the base split (background <
# FLIGHT_DEPTH[0] <= mid < FLIGHT_DEPTH[1] <= foreground); these shapes override it where the
# artwork's meaning disagrees: wings are mid-ground, the tail is background, the man and the
# dragon's forearm/foot are foreground.
FLIGHT_DEPTH = (0.3, 0.62)

FLIGHT_LEFT_WING = [
    (0, 335), (60, 355), (120, 405), (175, 455), (215, 510), (245, 545),
    (200, 580), (150, 610), (100, 640), (0, 655),
]  # fmt: skip
FLIGHT_RIGHT_WING = [
    (700, 330), (720, 260), (760, 205), (830, 170), (900, 125), (1000, 135), (1000, 520),
    (940, 500), (800, 495), (700, 525), (620, 500), (560, 490), (490, 447), (495, 440),
    (705, 450),
]  # fmt: skip
# Polylines (centre line, width): the tail winds up the left edge.
FLIGHT_TAIL = [
    ([(80, 62), (58, 100), (42, 160), (40, 230), (48, 285), (85, 302), (135, 308),
      (150, 340), (148, 400), (135, 445)], 44),
    ([(95, 625), (70, 665), (65, 720), (85, 760)], 44),
]  # fmt: skip
FLIGHT_MAN = [
    (632, 508), (650, 498), (668, 515), (700, 548), (740, 556), (765, 528), (775, 510),
    (800, 510), (818, 530), (815, 560), (840, 590), (855, 640), (870, 670), (868, 720),
    (858, 780), (866, 840), (850, 884), (810, 872), (760, 874), (720, 892), (690, 886),
    (682, 825), (696, 742), (682, 680), (676, 605), (650, 545),
]  # fmt: skip
FLIGHT_FOREGROUND_EXTRAS = [
    [(500, 690), (560, 680), (620, 700), (645, 760), (640, 800), (590, 810), (540, 790), (500, 740)],
    [(395, 860), (470, 880), (490, 930), (430, 960), (390, 930)],
]  # fmt: skip

# Where the dragon's breath comes from (full-resolution coordinates).
DRAGON_NOSTRIL = (1880, 1235)
