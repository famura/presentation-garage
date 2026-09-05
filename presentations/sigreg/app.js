/* SIGReg presentation — interactive visuals (D3).
 *
 * Everything here is self-contained: the Epps–Pulley machinery is reimplemented
 * following djepa/regularization/sigreg.py so the numbers on the slides are the
 * real thing, not a mock-up:
 *   nodes  t   = linspace(0, 3, 17)
 *   weights    = trapezoid rule, folded with the Gaussian window w(t)=e^{-t^2/2}
 *   phi_0(t)   = e^{-t^2/2}                       (CF of the standard normal)
 *   ECF(t)     = mean_n exp(i t x_n)              (empirical characteristic fn)
 *   err(t)     = (Re ECF - phi_0)^2 + (Im ECF)^2
 *   sum        = sum_t err(t) * weights(t)        (the weighted quadrature integral)
 *   statistic  = N · sum                          (the SIGReg statistic; N factor kept)
 *
 * The on-slide readouts show the canonical Epps–Pulley statistic N·(that sum),
 * i.e. epStatistic() times the sample count N. SIGReg keeps this N factor (the
 * original Epps–Pulley normalization), which makes the statistic sharply minimized
 * at exactly N(0,1) (std=1) instead of flattening to ~0 over a band, so the demo
 * actually shows where the minimum sits.
 */
(function () {
  "use strict";

  const C = {
    accent: "#c5432a",
    accentSoft: "#e07a5f",
    deep: "#1e4a44",
    deepSoft: "#3d5a55",
    ink: "#1b1813",
    muted: "#55514a",
    paper: "#f4f1de",
    grid: "rgba(27,24,19,0.12)",
  };

  // ---- Epps–Pulley quadrature setup (mirrors sigreg.py) --------------------
  const NUM_NODES = 17;
  const T = d3.range(NUM_NODES).map((i) => (3 * i) / (NUM_NODES - 1));
  const DT = 3 / (NUM_NODES - 1);
  const WINDOW = T.map((t) => Math.exp(-0.5 * t * t)); // phi_0 AND weight window
  const TRAP = T.map((_, i) => (i === 0 || i === NUM_NODES - 1 ? DT : 2 * DT));
  const QW = TRAP.map((w, i) => w * WINDOW[i]); // folded quadrature weights

  function epStatistic(samples) {
    const n = samples.length;
    let stat = 0;
    for (let k = 0; k < NUM_NODES; k++) {
      const t = T[k];
      let re = 0,
        im = 0;
      for (let j = 0; j < n; j++) {
        re += Math.cos(t * samples[j]);
        im += Math.sin(t * samples[j]);
      }
      re /= n;
      im /= n;
      const d = re - WINDOW[k];
      stat += (d * d + im * im) * QW[k];
    }
    return stat;
  }

  // The SIGReg statistic: canonical Epps–Pulley = N · (quadrature integral).
  // Sharply minimized at N(0,1); this is what the slide readouts display.
  function epStatN(samples) {
    return samples.length * epStatistic(samples);
  }

  // Legible fixed-point formatting across the wide range the ×N statistic spans
  // (≈0.001 at the optimum up to ~140 for the strongly non-Gaussian example).
  function fmtStat(v) {
    return v < 1 ? v.toFixed(3) : v < 100 ? v.toFixed(2) : v.toFixed(1);
  }

  // continuous ECF curves for plotting (finer t grid)
  function ecfCurves(samples, tGrid) {
    const n = samples.length;
    return tGrid.map((t) => {
      let re = 0,
        im = 0;
      for (let j = 0; j < n; j++) {
        re += Math.cos(t * samples[j]);
        im += Math.sin(t * samples[j]);
      }
      return { t, re: re / n, im: im / n, phi0: Math.exp(-0.5 * t * t) };
    });
  }

  // ---- deterministic standard-normal "sample" via quantiles ---------------
  function probit(p) {
    // Acklam's inverse normal CDF approximation
    const a = [
      -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
      1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
    ];
    const b = [
      -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
      6.680131188771972e1, -1.328068155288572e1,
    ];
    const c = [
      -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
      -2.549732539343734, 4.374664141464968, 2.938163982698783,
    ];
    const d = [
      7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
      3.754408661907416,
    ];
    const pl = 0.02425;
    let q, r;
    if (p < pl) {
      q = Math.sqrt(-2 * Math.log(p));
      return (
        (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
      );
    } else if (p <= 1 - pl) {
      q = p - 0.5;
      r = q * q;
      return (
        ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) *
          q) /
        (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
      );
    }
    q = Math.sqrt(-2 * Math.log(1 - p));
    return (
      -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }

  const N = 400;
  const BASE_Z = d3.range(N).map((i) => probit((i + 0.5) / N)); // perfectly Gaussian base

  // sinh-arcsinh skew (monotone, no folding), then standardize, then place at (mu, sigma)
  function makeSamples(mu, sigma, skew) {
    let y = BASE_Z.map((z) => Math.sinh(skew + Math.asinh(z)));
    const m = d3.mean(y);
    const sd = Math.sqrt(d3.mean(y.map((v) => (v - m) * (v - m))));
    return y.map((v) => mu + sigma * ((v - m) / sd));
  }

  // gaussian KDE for a smooth density curve
  function kde(samples, grid, bw) {
    const inv = 1 / (samples.length * bw * Math.sqrt(2 * Math.PI));
    return grid.map((g) => {
      let s = 0;
      for (let j = 0; j < samples.length; j++) {
        const u = (g - samples[j]) / bw;
        s += Math.exp(-0.5 * u * u);
      }
      return { x: g, y: s * inv };
    });
  }

  // Shared kernel width for the density panels. The target N(0,1) is KDE-smoothed
  // with the SAME bandwidth as the empirical curve, so the (identical) smoothing
  // cancels: the two curves overlay exactly when the sample is truly N(0,1), and
  // separate only for real distributional differences — matching the statistic.
  const KDE_BW = 0.22;

  // ---- reusable density panel (x-space): target N(0,1) vs empirical --------
  function densityPanel(svgSel, samples, opts) {
    opts = opts || {};
    const W = 560,
      H = 300,
      m = { t: 16, r: 14, b: 34, l: 14 };
    const svg = d3
      .select(svgSel)
      .attr("viewBox", `0 0 ${W} ${H}`)
      .attr("class", "plot");
    svg.selectAll("*").remove();
    const x = d3
      .scaleLinear()
      .domain([-5, 5])
      .range([m.l, W - m.r]);
    const grid = d3.range(-5, 5.02, 0.08);
    const tgt = kde(BASE_Z, grid, KDE_BW); // reference N(0,1), same kernel as the empirical curve
    // y-domain is recomputed on every render so a narrow (small-sigma) spike
    // never clips at the top when the slider is dragged.
    const y = d3.scaleLinear().range([H - m.b, m.t]);

    svg
      .append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${H - m.b})`)
      .call(d3.axisBottom(x).ticks(6).tickSize(4))
      .call((g) => g.selectAll("text").attr("font-size", 13));

    const area = d3
      .area()
      .x((d) => x(d.x))
      .y0(() => y(0))
      .y1((d) => y(d.y))
      .curve(d3.curveBasis);
    const line = d3
      .line()
      .x((d) => x(d.x))
      .y((d) => y(d.y))
      .curve(d3.curveBasis);

    // target (dashed bell) — redrawn on render so it tracks the rescaled axis
    const tgtArea = svg
      .append("path")
      .attr("fill", C.deep)
      .attr("opacity", 0.1);
    const tgtLine = svg
      .append("path")
      .attr("fill", "none")
      .attr("stroke", C.deep)
      .attr("stroke-width", 2.5)
      .attr("stroke-dasharray", "7 5");
    // empirical
    const empArea = svg
      .append("path")
      .attr("class", "emp-area")
      .attr("opacity", 0.16);
    const empLine = svg
      .append("path")
      .attr("class", "emp-line")
      .attr("fill", "none")
      .attr("stroke-width", 3);

    function render(sampleSet, color) {
      const col = color || opts.color || C.accent;
      const emp = kde(sampleSet, grid, KDE_BW);
      const ymax =
        Math.max(
          0.42,
          d3.max(emp, (d) => d.y),
          d3.max(tgt, (d) => d.y),
        ) * 1.12;
      y.domain([0, ymax]);
      tgtArea.attr("d", area(tgt));
      tgtLine.attr("d", line(tgt));
      empArea.attr("d", area(emp)).attr("fill", col);
      empLine.attr("d", line(emp)).attr("stroke", col);
    }
    render(samples, opts.color);

    return {
      update(newSamples, color) {
        render(newSamples, color);
      },
    };
  }

  // ---- reusable CF panel: phi_0(t) vs Re ECF(t), shaded discrepancy --------
  function cfPanel(svgSel, samples, opts) {
    opts = opts || {};
    const W = 560,
      H = 300,
      m = { t: 18, r: 16, b: 40, l: 40 };
    const svg = d3
      .select(svgSel)
      .attr("viewBox", `0 0 ${W} ${H}`)
      .attr("class", "plot");
    svg.selectAll("*").remove();
    const tGrid = d3.range(0, 3.001, 0.05);
    const x = d3
      .scaleLinear()
      .domain([0, 3])
      .range([m.l, W - m.r]);
    const y = d3
      .scaleLinear()
      .domain([-0.25, 1])
      .range([H - m.b, m.t]);

    svg
      .append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${y(0)})`)
      .call(d3.axisBottom(x).ticks(6).tickSize(4))
      .call((g) => g.selectAll("text").attr("font-size", 13));
    svg
      .append("g")
      .attr("class", "axis")
      .attr("transform", `translate(${m.l},0)`)
      .call(d3.axisLeft(y).ticks(4).tickSize(4))
      .call((g) => g.selectAll("text").attr("font-size", 13));
    svg
      .append("text")
      .attr("x", W - m.r)
      .attr("y", y(0) + 30)
      .attr("text-anchor", "end")
      .attr("font-size", 14)
      .attr("fill", C.muted)
      .text("frequency  t");

    const line = d3
      .line()
      .x((d) => x(d.t))
      .curve(d3.curveMonotoneX);
    const phi0Line = line.y((d) => y(d.phi0));

    const data0 = ecfCurves(samples, tGrid);
    // shaded discrepancy band between Re ECF and phi_0
    const band = d3
      .area()
      .x((d) => x(d.t))
      .y0((d) => y(d.phi0))
      .y1((d) => y(d.re))
      .curve(d3.curveMonotoneX);
    svg
      .append("path")
      .attr("class", "cf-band")
      .attr("d", band(data0))
      .attr("fill", opts.color || C.accent)
      .attr("opacity", 0.18);
    // phi_0 target (teal, dashed)
    svg
      .append("path")
      .attr(
        "d",
        d3
          .line()
          .x((d) => x(d.t))
          .y((d) => y(d.phi0))
          .curve(d3.curveMonotoneX)(data0),
      )
      .attr("fill", "none")
      .attr("stroke", C.deep)
      .attr("stroke-width", 3)
      .attr("stroke-dasharray", "7 5");
    // Re ECF (accent)
    svg
      .append("path")
      .attr("class", "cf-re")
      .attr(
        "d",
        d3
          .line()
          .x((d) => x(d.t))
          .y((d) => y(d.re))
          .curve(d3.curveMonotoneX)(data0),
      )
      .attr("fill", "none")
      .attr("stroke", opts.color || C.accent)
      .attr("stroke-width", 3);
    // Im ECF (thin dotted) — zero for symmetric, grows with skew
    svg
      .append("path")
      .attr("class", "cf-im")
      .attr(
        "d",
        d3
          .line()
          .x((d) => x(d.t))
          .y((d) => y(d.im))
          .curve(d3.curveMonotoneX)(data0),
      )
      .attr("fill", "none")
      .attr("stroke", opts.color || C.accent)
      .attr("stroke-width", 1.6)
      .attr("stroke-dasharray", "2 3")
      .attr("opacity", 0.7);

    return {
      update(newSamples, color) {
        const d = ecfCurves(newSamples, tGrid);
        svg.select(".cf-band").attr("d", band(d)).attr("fill", color);
        svg
          .select(".cf-re")
          .attr(
            "d",
            d3
              .line()
              .x((p) => x(p.t))
              .y((p) => y(p.re))
              .curve(d3.curveMonotoneX)(d),
          )
          .attr("stroke", color);
        svg
          .select(".cf-im")
          .attr(
            "d",
            d3
              .line()
              .x((p) => x(p.t))
              .y((p) => y(p.im))
              .curve(d3.curveMonotoneX)(d),
          )
          .attr("stroke", color);
      },
    };
  }

  // ---- decision threshold derived from (alpha, N) -------------------------
  // The verdict cutoff is a real Epps–Pulley critical value: the (1-alpha)
  // quantile of N·EP under H0 (the N points are a genuine N(0,1) sample).
  // Estimated by seeded Monte-Carlo so it is identical on every load. NOT a
  // hand-picked number: at N=400, alpha=0.05 this lands at ~2.9.
  const ALPHA = 0.05;
  const MC_REPS = 2000;
  const MC_SEED = 0x9e3779b9;

  // small deterministic PRNG so the simulated cutoff is stable across reloads
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // (1-alpha) quantile of N·EP over `reps` genuine N(0,1) samples of size N.
  function makeThreshold(alpha, reps, seed) {
    const rand = mulberry32(seed);
    const gauss = () => {
      let u = 0,
        v = 0;
      while (u === 0) u = rand();
      while (v === 0) v = rand();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); // Box–Muller
    };
    const stats = new Array(reps);
    const s = new Array(N);
    for (let r = 0; r < reps; r++) {
      for (let j = 0; j < N; j++) s[j] = gauss();
      stats[r] = epStatN(s);
    }
    stats.sort((x, y) => x - y);
    return stats[Math.min(reps - 1, Math.floor((1 - alpha) * reps))];
  }

  // alpha=0.05 critical value of N·EP at N=400 (~2.9), simulated live in-browser.
  const GAUSS_THRESHOLD = makeThreshold(ALPHA, MC_REPS, MC_SEED);

  // colour ramp from teal (small stat) to terracotta (large stat); the top of the
  // ramp is tied to the decision cutoff, so full terracotta = the verdict flip.
  const statColor = d3
    .scaleLinear()
    .domain([0, GAUSS_THRESHOLD / 5, GAUSS_THRESHOLD])
    .range([C.deep, C.accentSoft, C.accent])
    .clamp(true);

  // ---- slide: characteristic-function fingerprint -------------------------
  function initCF() {
    const el = document.querySelector("#cf-fingerprint");
    if (!el) return;
    cfPanel("#cf-fingerprint", makeSamples(0.0, 1.0, 0.9), { color: C.accent });
  }

  // ---- slide: accept vs reject examples -----------------------------------
  function initExamples() {
    if (!document.querySelector("#ex-accept-d")) return;
    const accept = makeSamples(0, 1, 0); // standard normal
    const reject = makeSamples(0.6, 0.55, 0.9); // shifted, narrow (collapse-ish), skewed
    densityPanel("#ex-accept-d", accept, { color: C.deep });
    densityPanel("#ex-reject-d", reject, { color: C.accent });
    const sa = epStatN(accept),
      sr = epStatN(reject);
    const setNum = (id, v) => {
      const n = document.querySelector(id);
      if (n) n.textContent = fmtStat(v);
    };
    setNum("#ex-accept-stat", sa);
    setNum("#ex-reject-stat", sr);
  }

  // ---- slide: interactive slider ------------------------------------------
  function initSlider() {
    const root = document.querySelector("#sig-interactive");
    if (!root) return;
    const inputs = {
      mu: root.querySelector("#s-mu"),
      sigma: root.querySelector("#s-sigma"),
      skew: root.querySelector("#s-skew"),
    };
    const out = {
      mu: root.querySelector("#v-mu"),
      sigma: root.querySelector("#v-sigma"),
      skew: root.querySelector("#v-skew"),
      stat: root.querySelector("#v-stat"),
      verdict: root.querySelector("#v-verdict"),
    };
    let dens, cf;
    function render() {
      const mu = +inputs.mu.value,
        sigma = +inputs.sigma.value,
        skew = +inputs.skew.value;
      out.mu.textContent = mu.toFixed(2);
      out.sigma.textContent = sigma.toFixed(2);
      out.skew.textContent = skew.toFixed(2);
      const s = makeSamples(mu, sigma, skew);
      const stat = epStatN(s);
      const col = statColor(stat);
      if (!dens) {
        dens = densityPanel("#si-density", s, { color: col });
        cf = cfPanel("#si-cf", s, { color: col });
      } else {
        dens.update(s, col);
        cf.update(s, col);
      }
      out.stat.textContent = fmtStat(stat);
      out.stat.style.color = col;
      const near = stat < GAUSS_THRESHOLD;
      out.verdict.textContent =
        (near ? "looks Gaussian ✓" : "not Gaussian ✗") +
        ` · cutoff ${fmtStat(GAUSS_THRESHOLD)} (α=${ALPHA})`;
      out.verdict.style.color = col;
    }
    Object.values(inputs).forEach(
      (i) => i && i.addEventListener("input", render),
    );
    render();
  }

  // ---- slide: Cramér–Wold slicing (2-D cloud → 3 slice marginals) ----------
  // A fixed, deterministic non-Gaussian cloud (the same anisotropic/sheared/
  // skewed warp the §9 video uses) is projected onto 3 fixed directions. Each
  // projection's 1-D marginal density is drawn *along its own slice line*, so the
  // three marginals fan out around the cloud — a direct picture of Cramér–Wold:
  // the full 2-D law is pinned down by all of its 1-D projections. Isometric px
  // mapping (equal scale on both axes) keeps the slices visually perpendicular.
  function initCramerWold() {
    const sel = "#cw-canvas";
    if (!document.querySelector(sel)) return;
    const W = 560,
      H = 420,
      PAD = 0.06;
    const svg = d3
      .select(sel)
      .attr("viewBox", `0 0 ${W} ${H}`)
      .attr("class", "plot");
    svg.selectAll("*").remove();

    // deterministic 2-D cloud: standard normal → stretch/shear/skew (matches §9)
    const NC = 260;
    const rnd = mulberry32(0x5c1ce5);
    const gauss = () => {
      let u = 0,
        v = 0;
      while (u === 0) u = rnd();
      while (v === 0) v = rnd();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); // Box–Muller
    };
    const pts = [];
    for (let i = 0; i < NC; i++) {
      const z0 = gauss(),
        z1 = gauss();
      let x = 1.55 * z0; // stretch
      const y = 0.42 * z1 + 0.55 * x; // shear → correlation
      x = x + 0.16 * (x * x - 2.3); // skew → banana tail
      pts.push([x, y]);
    }
    const cx = d3.mean(pts, (p) => p[0]),
      cy = d3.mean(pts, (p) => p[1]);

    // three fixed slice directions; each gets its own colour + marginal
    const DEG = Math.PI / 180;
    const PEAK = 1.25, // marginal height in data units (perpendicular to the line)
      BW = 0.3;
    const SLICES = [
      { deg: 22, col: C.accent },
      { deg: 82, col: "#a8791e" }, // gold (tertiary accent)
      { deg: 142, col: C.deep },
    ].map((s, ki) => {
      const th = s.deg * DEG;
      const u = [Math.cos(th), Math.sin(th)]; // slice direction
      const n = [-Math.sin(th), Math.cos(th)]; // perpendicular (marginal grows here)
      const proj = pts.map((p) => (p[0] - cx) * u[0] + (p[1] - cy) * u[1]); // aᵀ(x−c)
      const sMin = d3.min(proj) - 0.4,
        sMax = d3.max(proj) + 0.4;
      const grid = d3.range(sMin, sMax + 1e-6, (sMax - sMin) / 80);
      const dens = kde(proj, grid, BW); // [{x:s, y:density}]
      const ampScale = PEAK / (d3.max(dens, (d) => d.y) || 1);
      const step = Math.max(1, Math.round(NC / 42));
      const whisk = [];
      for (let i = 0; i < NC; i += step) {
        const sp = proj[i];
        whisk.push({ p: pts[i], foot: [cx + sp * u[0], cy + sp * u[1]] }); // point → its projection
      }
      return {
        u,
        n,
        col: s.col,
        sMin,
        sMax,
        dens,
        ampScale,
        whisk,
        ki,
        label: [cx + sMax * 1.06 * u[0], cy + sMax * 1.06 * u[1]],
      };
    });

    // isometric fit: bounding box over cloud + full-amp marginals + labels
    const allX = [],
      allY = [];
    const push = (x, y) => {
      allX.push(x);
      allY.push(y);
    };
    pts.forEach((p) => push(p[0], p[1]));
    SLICES.forEach((sl) => {
      sl.dens.forEach((d) =>
        push(
          cx + d.x * sl.u[0] + d.y * sl.ampScale * sl.n[0],
          cy + d.x * sl.u[1] + d.y * sl.ampScale * sl.n[1],
        ),
      );
      push(cx + sl.sMin * sl.u[0], cy + sl.sMin * sl.u[1]);
      push(cx + sl.sMax * sl.u[0], cy + sl.sMax * sl.u[1]);
      push(sl.label[0], sl.label[1]);
    });
    let minX = d3.min(allX),
      maxX = d3.max(allX),
      minY = d3.min(allY),
      maxY = d3.max(allY);
    const spanX = maxX - minX,
      spanY = maxY - minY;
    minX -= spanX * PAD;
    maxX += spanX * PAD;
    minY -= spanY * PAD;
    maxY += spanY * PAD;
    const k = Math.min(W / (maxX - minX), H / (maxY - minY));
    const offx = (W - k * (maxX - minX)) / 2,
      offy = (H - k * (maxY - minY)) / 2;
    const PX = (x) => offx + k * (x - minX);
    const PY = (y) => offy + k * (maxY - y); // flip y for screen coords

    // static cloud (neutral ink so the coloured slices/marginals read clearly)
    svg
      .append("g")
      .selectAll("circle")
      .data(pts)
      .join("circle")
      .attr("cx", (d) => PX(d[0]))
      .attr("cy", (d) => PY(d[1]))
      .attr("r", 2.4)
      .attr("fill", C.ink)
      .attr("opacity", 0.26);

    // per-slice DOM: whiskers, line, marginal fill + stroke, label
    const sub = ["₁", "₂", "₃"];
    const sg = SLICES.map((sl) => {
      const grp = svg.append("g");
      const whiskSel = grp
        .append("g")
        .attr("stroke", sl.col)
        .attr("stroke-width", 0.8);
      whiskSel
        .selectAll("line")
        .data(sl.whisk)
        .join("line")
        .attr("x1", (d) => PX(d.p[0]))
        .attr("y1", (d) => PY(d.p[1]))
        .attr("x2", (d) => PX(d.foot[0]))
        .attr("y2", (d) => PY(d.foot[1]));
      const lineSel = grp
        .append("line")
        .attr("stroke", sl.col)
        .attr("stroke-width", 2)
        .attr("stroke-linecap", "round");
      const fillSel = grp.append("path").attr("fill", sl.col);
      const strokeSel = grp
        .append("path")
        .attr("fill", "none")
        .attr("stroke", sl.col)
        .attr("stroke-width", 2.2);
      const lab = grp
        .append("text")
        .attr("x", PX(sl.label[0]))
        .attr("y", PY(sl.label[1]))
        .attr("fill", sl.col)
        .attr("font-size", 16)
        .attr("font-weight", 600)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .text("a" + sub[sl.ki]);
      return { sl, whiskSel, lineSel, fillSel, strokeSel, lab };
    });

    // marginal path (offset density curve), open for the stroke
    function curvePath(sl, amp) {
      let d = "";
      sl.dens.forEach((pt, i) => {
        const x = PX(cx + pt.x * sl.u[0] + pt.y * sl.ampScale * amp * sl.n[0]);
        const y = PY(cy + pt.x * sl.u[1] + pt.y * sl.ampScale * amp * sl.n[1]);
        d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1) + " ";
      });
      return d;
    }
    function fillPath(sl, amp) {
      const bMax = [PX(cx + sl.sMax * sl.u[0]), PY(cy + sl.sMax * sl.u[1])];
      const bMin = [PX(cx + sl.sMin * sl.u[0]), PY(cy + sl.sMin * sl.u[1])];
      return (
        curvePath(sl, amp) +
        `L${bMax[0].toFixed(1)} ${bMax[1].toFixed(1)} L${bMin[0].toFixed(1)} ${bMin[1].toFixed(1)} Z`
      );
    }

    // animation clock: cloud stays; slices reveal one after another, then loop
    const CYCLE = 10.0,
      SLT = 2.7,
      START = 0.5;
    const smooth = (t) => {
      t = Math.max(0, Math.min(1, t));
      return t * t * (3 - 2 * t);
    };
    const ramp = (t, a, b) => smooth((t - a) / (b - a));

    function draw(elapsed) {
      const ct = elapsed % CYCLE;
      const vis = 1 - ramp(ct, CYCLE - 0.9, CYCLE); // fade everything out before the wrap
      sg.forEach(({ sl, whiskSel, lineSel, fillSel, strokeSel, lab }, ki) => {
        const base = START + ki * SLT;
        const lineP = ramp(ct, base, base + 0.5);
        // whiskers fade in as we project, then fade out so the final hold stays clean
        const whiskP =
          ramp(ct, base + 0.28, base + 0.9) *
          (1 - ramp(ct, base + 1.5, base + 2.0));
        const ampP = ramp(ct, base + 0.55, base + 1.7);
        const e1x = cx + sl.sMin * lineP * sl.u[0],
          e1y = cy + sl.sMin * lineP * sl.u[1];
        const e2x = cx + sl.sMax * lineP * sl.u[0],
          e2y = cy + sl.sMax * lineP * sl.u[1];
        lineSel
          .attr("x1", PX(e1x))
          .attr("y1", PY(e1y))
          .attr("x2", PX(e2x))
          .attr("y2", PY(e2y))
          .attr("opacity", lineP * vis);
        whiskSel.attr("opacity", whiskP * vis * 0.4);
        strokeSel.attr("d", curvePath(sl, ampP)).attr("opacity", ampP * vis);
        fillSel
          .attr("d", fillPath(sl, ampP))
          .attr("opacity", ampP * vis * 0.16);
        lab.attr("opacity", ampP * vis);
      });
    }

    // play only while this slide is on screen (no CPU burned elsewhere)
    let raf = null,
      startT = null;
    const frame = (ts) => {
      if (startT === null) startT = ts;
      draw((ts - startT) / 1000);
      raf = requestAnimationFrame(frame);
    };
    const play = () => {
      if (raf === null) {
        startT = null;
        raf = requestAnimationFrame(frame);
      }
    };
    const stop = () => {
      if (raf !== null) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    };
    const mySlide = document.querySelector(sel).closest("section");
    const sync = () => {
      const cur =
        window.Reveal && Reveal.getCurrentSlide
          ? Reveal.getCurrentSlide()
          : null;
      if (!cur || cur === mySlide) play();
      else stop();
    };
    if (window.Reveal && Reveal.on) {
      Reveal.on("slidechanged", sync);
      Reveal.on("ready", sync);
    }
    draw(0); // paint the first frame immediately
    sync();
  }

  function initAll() {
    if (typeof d3 === "undefined") return;
    initCF();
    initExamples();
    initSlider();
    initCramerWold();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
