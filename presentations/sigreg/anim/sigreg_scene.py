"""Manim scene for the SigREG presentation.

Shows an anisotropic / partially-collapsed embedding cloud in 2-D being driven
toward an isotropic Gaussian by minimizing the sliced Epps-Pulley statistic.
A single projection (onto the x-axis) is tracked underneath: its empirical
density morphs into the standard-normal bell curve phi_0, and an illustrative
"sliced EP loss" counter decreases toward zero.

No LaTeX is used (Text / Pango only, no MathTex or DecimalNumber) so the scene
renders without a TeX installation. Palette matches the presentation:
  paper #F4F1DE  ink #1F1D1A  accent/terracotta #D1553A  deep/teal #234E48
"""

import numpy as np
from manim import (
    Axes,
    Circle,
    Create,
    DashedVMobject,
    Dot,
    DOWN,
    FadeIn,
    LEFT,
    Scene,
    Text,
    UP,
    UR,
    ValueTracker,
    VGroup,
    always_redraw,
    config,
    interpolate_color,
    rate_functions,
)
from manim.utils.color import ManimColor

# --- palette -----------------------------------------------------------------
PAPER = ManimColor("#F4F1DE")
INK = ManimColor("#1F1D1A")
ACCENT = ManimColor("#D1553A")  # terracotta -> "before" (non-Gaussian)
DEEP = ManimColor("#234E48")   # teal       -> "after"  (isotropic Gaussian)
MUTED = ManimColor("#6B6B6B")

config.background_color = PAPER

N = 320
RNG = np.random.default_rng(7)
FONT = "Helvetica"


def _clouds():
    """Return (start, end) index-matched point clouds.

    ``end`` is an isotropic standard Gaussian; ``start`` is the same cloud warped
    into an anisotropic, sheared, skewed and vertically-squashed (near-collapsed)
    band, so the morph start->end is a smooth, low-crossing flow.
    """
    end = RNG.standard_normal((N, 2))  # target: isotropic N(0, I)
    a = end.copy()
    a[:, 1] *= 0.30              # squash vertically  -> partial collapse
    a[:, 0] *= 1.70              # stretch horizontally
    a[:, 1] += 0.65 * a[:, 0]    # shear -> strong correlation
    a[:, 0] += 0.32 * a[:, 0] ** 2 - 0.7  # skew
    return a.astype(float), end.astype(float)


def _kde(samples, grid, bw=0.32):
    """Cheap Gaussian KDE evaluated on ``grid`` (returns a density curve)."""
    d = (grid[:, None] - samples[None, :]) / bw
    dens = np.exp(-0.5 * d * d).sum(axis=1) / (samples.size * bw * np.sqrt(2 * np.pi))
    return dens


class SigRegFlow(Scene):
    def construct(self):
        alpha = ValueTracker(0.0)
        start, end = _clouds()

        # --- top: 2-D scatter --------------------------------------------------
        axes = Axes(
            x_range=[-4, 4, 1], y_range=[-3, 3, 1],
            x_length=7.2, y_length=4.2, tips=False,
            axis_config={"stroke_color": MUTED, "stroke_width": 2, "include_ticks": False},
        ).shift(0.55 * UP)

        def sigma_circle():
            c = Circle(color=DEEP, stroke_width=3)
            c.stretch_to_fit_width(axes.c2p(2, 0)[0] - axes.c2p(0, 0)[0])
            c.stretch_to_fit_height(axes.c2p(0, 2)[1] - axes.c2p(0, 0)[1])
            c.move_to(axes.c2p(0, 0))
            return DashedVMobject(c, num_dashes=48).set_opacity(0.85 * alpha.get_value())

        ref_circle = always_redraw(sigma_circle)

        dots = VGroup(*[Dot(radius=0.035, color=ACCENT) for _ in range(N)])

        def place_dots(group):
            a = alpha.get_value()
            pts = (1 - a) * start + a * end
            col = interpolate_color(ACCENT, DEEP, a)
            for dot, p in zip(group, pts):
                dot.move_to(axes.c2p(p[0], p[1]))
                dot.set_color(col)

        place_dots(dots)
        dots.add_updater(place_dots)

        # --- bottom: one projection (x-axis) vs the standard-normal bell -------
        paxes = Axes(
            x_range=[-4, 4, 1], y_range=[0, 0.55, 0.25],
            x_length=7.2, y_length=1.9, tips=False,
            axis_config={"stroke_color": MUTED, "stroke_width": 2, "include_ticks": False},
        ).to_edge(DOWN, buff=0.85)

        grid = np.linspace(-4, 4, 200)
        phi0 = np.exp(-0.5 * grid * grid) / np.sqrt(2 * np.pi)  # N(0,1) target density
        target_curve = paxes.plot_line_graph(
            grid, phi0, add_vertex_dots=False, line_color=DEEP, stroke_width=4
        )

        emp_curve = always_redraw(
            lambda: paxes.plot_line_graph(
                grid,
                _kde(((1 - alpha.get_value()) * start + alpha.get_value() * end)[:, 0], grid),
                add_vertex_dots=False,
                line_color=interpolate_color(ACCENT, DEEP, alpha.get_value()),
                stroke_width=4,
            )
        )

        proj_label = Text("one random projection", font=FONT, color=MUTED, font_size=20)
        proj_label.next_to(paxes, UP, buff=0.05).align_to(paxes, LEFT)

        # --- loss counter (Text, no LaTeX) ------------------------------------
        loss_label = Text("sliced EP loss", font=FONT, color=MUTED, font_size=20)
        loss_label.to_corner(UR, buff=0.5).shift(0.7 * DOWN)

        def loss_number():
            v = 0.82 * (1 - alpha.get_value()) ** 1.6 + 0.01
            return Text(
                f"{v:.2f}", font=FONT, weight="BOLD",
                color=interpolate_color(ACCENT, DEEP, alpha.get_value()), font_size=44,
            ).next_to(loss_label, DOWN, buff=0.12).align_to(loss_label, LEFT)

        loss_num = always_redraw(loss_number)

        # --- play --------------------------------------------------------------
        self.play(Create(axes), Create(paxes), FadeIn(proj_label), run_time=1.0)
        self.play(FadeIn(dots), Create(target_curve), FadeIn(loss_label), run_time=1.2)
        self.add(emp_curve, ref_circle, loss_num)
        self.wait(0.6)
        self.play(alpha.animate.set_value(1.0), run_time=5.0, rate_func=rate_functions.ease_in_out_sine)
        self.wait(0.4)

        done = Text("no collapse: every 1-D slice matches N(0, 1)",
                    font=FONT, color=MUTED, font_size=20)
        done.to_edge(UP, buff=0.35)
        self.play(FadeIn(done), run_time=0.8)
        self.wait(1.4)
