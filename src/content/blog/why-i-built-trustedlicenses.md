---
title: Why I built trustedlicenses
date: 2026-10-04
description: GitHub-style licence detection, as a CI and pre-commit gate for projects where a licence mistake is expensive. It wraps the spdx Rust crate and follows FSF guidance, and does not reinvent either.
draft: true
---

<!--
REWRITE NOTES (delete before publishing)
- Structure: thesis, motivation (the licensecheck gap), what the tool does and what it wraps, the 'accept without exempting forever' feature, the licence-file fallback, observed behaviour, speed, when to use licensecheck instead, limitations, references.
- Every factual claim was checked against a primary source on 2026-10-04; the sources are in the references.
- Facts come from the trustedlicenses repo (README, docs/usage.md, docs/comparison.md, docs/performance.md, detection.py, policy.py, index.py, rust/Cargo.toml), the wiki page, earlier session research, the licensecheck issue tracker and PyPI release history, and reproducible runs on Python 3.14.4 (macOS) with trustedlicenses 0.3.1, licensecheck 2026.0.8 (and 2025.1.0 where stated) and liccheck 0.9.2.
- Facts that differ from your original brief: (1) the compatibility matrix is licensecheck's (27 variants), not the spdx crate's; (2) the setuptools/pkg_resources crash is liccheck's; (3) licensecheck is maintained and has fixed its worst bugs (June 2026), so the post argues from the year-long gap and from present differences, not from current breakage; (4) the 'sandbox' is `trustedlicenses check` (isolated resolve) and `index-check` (upgrade finder).
-->

**Repo:** [github.com/w-martin/trustedlicenses](https://github.com/w-martin/trustedlicenses)
· **Docs:** [trustedlicenses.readthedocs.io](https://trustedlicenses.readthedocs.io/)
· **PyPI:** [pypi.org/project/trustedlicenses](https://pypi.org/project/trustedlicenses/)

I built a command-line tool that brings GitHub-style licence detection to a CI job or a pre-commit hook, for projects where a licence mistake is expensive. It checks every package installed in a Python environment against a policy, fails closed on anything it cannot identify, and wraps existing work (the `spdx` Rust crate, and the FSF's published guidance) in place of inventing its own. In this post I describe the gap that motivated it, what it wraps and what it adds, and where it is the wrong choice. For examples, skip to the sections 'Accepting a declaration without exempting a package' and 'When the metadata is empty'.

<!-- SIGNPOST: the first paragraph is the thesis. Keep it to one paragraph, as in the typedframes post. -->

## Why dependency licences need a gate

In this section, I set out the problem that motivated the tool.

A Python project inherits the licence obligations of every package in its dependency tree, including transitive dependencies that nobody chose directly. For a corporate project, a strong-copyleft dependency may conflict with the terms under which the product is distributed. For an open-source project, the same dependency may conflict with the project's own licence. Furthermore, a package may change its declared licence between releases, and without an automated check this change reaches the build without anyone reading it.

Checking by hand does not scale beyond a handful of packages, and checking once does not protect against later changes. This motivates a check that runs on every build, in the same way as a linter or a type checker.


## A year-long gap in the existing tooling

In this section, I describe the tools I relied upon, and the period during which the one that enforces a policy was not usable on a current stack. Maintenance and behaviour statements were checked on 2026-10-04 against PyPI release history and the projects' issue trackers.

Three tools are commonly used for this task. [`pip-licenses`](https://github.com/raimon49/pip-licenses) lists the licence of every installed package; it is actively maintained, but it has no policy and therefore no pass or fail result. [`liccheck`](https://pypi.org/project/liccheck/) enforces a policy, but its last release was on 2023-09-22 and it imports `pkg_resources` without declaring `setuptools` as a dependency (its metadata requires only `semantic-version` and `toml`), so on a clean Python 3.14 environment it stops at `ModuleNotFoundError: No module named 'pkg_resources'`. [`licensecheck`](https://github.com/FHPythonUtils/LicenseCheck) was, and is, the closest to a complete solution.

The same gap affected my own projects. The typedframes repository used `licensecheck` 2025.1.0 for its dependency checks. That release depends on `fhconfparser`, whose 2024.1 release requires `attrs<24`, and every `licensecheck` release since 2026.0.0 requires Python 3.12 or later. When that floor was introduced, on 2026-06-12, Python 3.10 and 3.11 were both still in security support (end of life 2026-10-01 and 2027-10 respectively, per the Python developer guide), so the change excluded two supported versions. I found no reason for it in the project's commits, release notes or README, which states only that it uses Python 3.12 to 3.14. A floor of 3.12 may appear unremarkable in hindsight, but at the time it left projects such as typedframes, whose floor is 3.11, with a choice between an unfixed release and a migration. The latter, together with the reasons below, motivated the move to `trustedlicenses` (typedframes PR 70). I intend to keep the floor and the ceiling of `trustedlicenses` and typedframes aligned with the Python versions that are maintained at the time.

However, `licensecheck` published no release between 2025.1.0 on 2025-03-26 and 2026.0.0 on 2026-06-12, a period of approximately 14.5 months. Several defects remained open throughout. Issue 121 (opened 2025-05-06) reports that the PEP 639 `License-Expression` field was not found for installed packages, because the lookup used the key `License_Expression`; I confirmed that key in the 2025.1.0 source (`packageinfo.py`). Issues 122 (opened 2025-07-07) and 137 (opened 2025-12-09) report an `AttributeError` on licence expressions that contain an SPDX `WITH` exception, with packages such as `numba`, `llvmlite`, `shap` and `pygit2` named as triggers. All three were closed on 2026-06-16. In my own run, 2025.1.0 on Python 3.14 stopped with a stack trace in its uv resolver (`InvalidRequirement`) on a minimal `pyproject.toml`; I did not establish the cause, and it is not specific to 3.14.

The gap has since been closed: nine releases followed between 2026-06-12 and 2026-06-18, including a regression in 2026.0.2 on empty configurations (issue 147) that was fixed within a day, and the `WITH`-exception crash no longer reproduces in 2026.0.8 (`llvmlite` was listed without error). I therefore do not argue that `licensecheck` is broken today, nor that a project with a single maintainer is a poor choice, since `trustedlicenses` has one too. The argument is narrower: for most of a year a compliance gate could not be used on a current stack, and the way it failed (the crashes in issues 122, 137 and 147) did not tell the user what to do. `trustedlicenses` is designed to fail in a way that states what was found and what to change, and the differences described below follow from that.


## What trustedlicenses does

In this section, I describe the design, and make explicit which parts are wrapped from existing work.

### GitHub-style detection, from the SPDX list

GitHub identifies licences with [Licensee](https://github.com/licensee/licensee), which compares the text of a licence file against a corpus of known licences. `trustedlicenses` uses the same family of approach, in compiled form. The matcher is a small Rust extension, built with PyO3, that wraps the [`spdx`](https://docs.rs/spdx) crate maintained by Embark Studios, whose `detection` feature performs word-bigram Sørensen–Dice matching against the SPDX licence list. Per the repository's notes, this inlines the algorithm of [askalono](https://github.com/jpeddicord/askalono), whose repository was archived after its last commit on 2024-10-22. Embark Studios' `cargo-deny` 0.18.7 (2025-12-02, PR 812) moved from askalono to this crate for licence detection, and `cargo-about` depends on it as well. The corpus is compiled into the binary, so there is no data file to locate at runtime and no system library such as `libmagic` to install.

The detection is similar to Licensee's, not identical, and the differences are deliberate.

| | Licensee (GitHub) | trustedlicenses (via `spdx`) |
|---|---|---|
| Corpus | 47 licences (choosealicense.com) | the full SPDX licence list |
| Match threshold | 98% | 0.8, below the library default of 0.9 |
| File with several licences | whole-file match, which the trustedlicenses documentation, from reading Licensee's source, states would score below threshold and report no match | segmented, so each licence is reported |

The threshold of 0.8 has a measured justification in the repository: the genuine, unmodified BSD-3-Clause `LICENSE` files of `jupyter` and `prompt-toolkit` score 0.85 and 0.91 against the corpus, so the library default of 0.9 would miss the first, whereas 0.7 begins to misidentify BSD-3-Clause variants. askalono's own command-line tool also uses 0.8. I have not measured the accuracy of `trustedlicenses` against Licensee directly, and the README carries a disclaimer that detection can be wrong.


### The division of labour

| Concern | Supplied by |
|---|---|
| Licence identifiers, the SPDX licence list, text matching | the `spdx` crate (wrapped) |
| Reading `License-Expression` ([PEP 639](https://peps.python.org/pep-0639/)), classifiers, the `License` field | Python, via `importlib.metadata` |
| Fallback to the bundled `LICENSE`/`COPYING` file | Python discovery, then the `spdx` matcher |
| Categories (Permissive, Public Domain, Copyleft Limited, Copyleft) | an editorial taxonomy extracted from ScanCode Toolkit, not published by SPDX |
| Compatibility notes | trustedlicenses, deliberately narrow and grounded in the FSF's [GPL FAQ](https://www.gnu.org/licenses/gpl-faq.html#AllCompatibility) |
| Policy evaluation, error messages, review wizard | trustedlicenses |

The compatibility check is narrower than that of `licensecheck`, which implements a hand-rolled pairwise matrix over 27 licence variants (`license_matrix/__init__.py`, `matrix.csv`). `trustedlicenses` fires only on pairings that the FSF states explicitly, using exact SPDX identifiers, and reports them as notes to verify, never as a pass or fail result. For example, a category-level check would treat GPL-2.0-only and GPL-3.0-only as the same 'Copyleft' and pass them, whereas the FSF states that they are not compatible.

### Detection order, a policy, and a guided setup

Detection proceeds in priority order for each installed distribution. First, declared metadata is read, and a statement is trusted directly when it already names a real SPDX identifier. Second, only when no declared statement resolves, the text of any licence file bundled in the `.dist-info` directory is matched against the SPDX corpus. The common path is therefore essentially free: 322 of 425 packages in the repository's benchmark environment resolved from metadata in 0.04 seconds in total.

The policy is a list of acceptable categories:

```toml
[tool.trustedlicenses]
allowed-categories = ["Permissive", "Public Domain", "Copyleft Limited"]
```

There is deliberately no default: a project states what it is willing to accept. In order to avoid requiring the user to be a licensing expert, running the tool in a terminal with no policy configured starts a guided setup, which explains each category in plain language, reports how many installed packages fall into it, and writes the policy. In CI, or whenever no terminal is attached, it never prompts: it prints the detected licences and exits with status 0.

## Accepting a declaration without exempting a package

In this section, I describe a behaviour that motivated a design decision, using `catboost` as the example.

Some packages declare a licence in a form that cannot be resolved automatically. `catboost` 1.2.10 declares the free-text field `License: Apache License, Version 2.0`, with no `License-Expression`, no licence classifier, and no bundled licence file. A free-text field is a claim and not an identifier, so `trustedlicenses` reports the package as undetected, suggests `Apache-2.0` from the declared text, and does not trust the suggestion by default:

```
  catboost: no license detected -- from no license information found
    -> looks like Apache-2.0 from its declared metadata ("Apache License, Version 2.0"),
       not trusted by default -- review interactively, or add trust-corrected-licenses /
       verified-packages / verified-statements to your policy
```

The usual remedy in other tools is to exempt the package by name (`ignore_packages` in `licensecheck`, `ignored-packages` in `trustedlicenses`). That exemption has no memory of why it was granted. Conversely, `trustedlicenses` can record the statement that was reviewed:

```toml
[tool.trustedlicenses.verified-packages]
catboost = { statement = "Apache License, Version 2.0", spdx-id = "Apache-2.0" }
```

The pin applies only while the declared statement still matches. If the declaration changes, the pin stops applying and the package needs review again. A narrower variant, `verified-statements`, trusts an exact statement for any package that carries it, which suits several internal packages sharing identical boilerplate.

The difference matters in the following scenario. I simulated a release of `catboost` that changes its declared licence, by editing the installed metadata of catboost 1.2.10 in a throwaway environment (Python 3.14.4, `trustedlicenses` 0.3.1, `licensecheck` 2026.0.8), with `catboost` pinned in one tool and ignored in the other.

| `catboost` declares | `licensecheck` with `ignore_packages = ["catboost"]` | `trustedlicenses` with the pin above |
|---|---|---|
| `Apache License, Version 2.0` | compatible | passes |
| `GPL-3.0-only` | compatible (`GPL-3.0-only`) | fails: `detected GPL-3.0-only (categories: Copyleft)` |
| `GNU General Public License v3.0` | compatible | fails: `no license detected`, review required (the bare phrase is deliberately not resolved) |

The third phrase fails for a different reason from the second. A bare 'GNU General Public License v3.0' does not state whether 'only' or 'or later' applies, and the section of PEP 639 on converting legacy metadata states that tools must not fill `License-Expression` from a legacy `License` field or classifier without informing the user and requiring unambiguous, affirmative user action. `trustedlicenses` applies the same principle: it leaves the statement unresolved, and the build fails until a person decides.

An exemption by package name continues to pass a package after it has moved to a strong-copyleft licence, and a project that ships the result may be in breach without any signal from the check. A pin on the reviewed statement stops passing the moment the statement changes. This is the same principle as a lockfile hash: approval attaches to what was reviewed, and not to a name.

<!-- SIGNPOST: this is your motivating example. The table is from an actual run; the 'new release' is simulated by editing the installed METADATA in a sandbox, and the original file was restored afterwards. `ignored-packages` in trustedlicenses is also by name, and is described as such, so the comparison is between the two mechanisms and not between the two tools' exemption lists. -->

## When the metadata is empty

In this section, I describe what happens when a package declares nothing, and how to resolve it.

[PEP 639](https://peps.python.org/pep-0639/) (status Final, and implemented by PyPI in late 2024, per pypi/warehouse issue 16620, closed 2024-12-18) standardised the `License-Expression` field, but a package that predates it, or that declares nothing usable, leaves a metadata-only checker with nothing to report. `licensecheck` reads `License-Expression`, then classifiers, then the `License` field, and per its source (`packageinforesolver.py`) it does not read the licence file shipped inside the package. In the 425-package benchmark environment, approximately 23% of packages had no usable declared metadata, and 96 of them were resolved only by reading a bundled licence file.

A concrete case, from the 208-distribution environment: `huey` 3.4.0 declares no licence field and no classifiers, and `skops` 0.16.0 declares only the generic classifier `License :: OSI Approved`. Both ship a `LICENSE` file in `.dist-info/licenses/`. `licensecheck` listed both with an empty licence column and a cross. `trustedlicenses` matched the bundled files and resolved both to `MIT`.

### Resolving a package that declares no licence

When a package is reported as undetected, the usual remedy is a newer release. `webencodings` 0.5.1 bundles no licence file, whereas 0.6.0 and later do. The command `trustedlicenses index-check <package>`, which the review wizard also offers for each undetected package, asks the package index for exactly this information. It is opt-in: a plain check makes no network call.

The index is the one the project already uses, taken in order from the lockfile's recorded source for that package (`uv.lock`, `poetry.lock`, `Pipfile.lock`), then from index settings in `pyproject.toml`, `uv.toml` or `Pipfile`, then from `UV_DEFAULT_INDEX`, `UV_INDEX_URL`, `PIP_INDEX_URL` and `pip.conf`, and only then from pypi.org, labelled as a default. This ordering matters for internal packages, because the chosen index is shown before anything is sent, and only the package name is ever sent. For each newer release, oldest first, the command reads the per-release metadata where the index offers it (PEP 658), and otherwise downloads the wheel (up to 25 MB), and it stops at the first release that declares a licence file or a licence that can be resolved:

```
$ trustedlicenses index-check webencodings
Asking https://pypi.org/simple (from default -- no index is configured for this project) about 'webencodings'...
  Index: https://pypi.org/simple
    credentials: none; JSON API: yes; separate metadata (PEP 658): yes
  webencodings 0.5.1:
    0.6.0 is the first newer release that ships a license (License-File: LICENSE).
    The latest release is 0.6.1.
    -> upgrading to webencodings>=0.6.0 would let this be detected. ...
```

Two limits apply. First, 'ships a license' is judged from what the release declares, so a wheel that bundles a file without declaring it can be missed. Second, the command establishes that a licence can be detected in a newer release, and does not itself evaluate that licence against the policy, nor whether the other dependencies permit the upgrade, which remains the resolver's decision.

### Checking before adding

The command `trustedlicenses check <package>` answers the question 'would adding this package introduce a licence problem' without installing anything into the real environment. It resolves the package and its transitive dependencies into an isolated temporary directory, using `uv pip install --target` or `pip install --target`, and evaluates the set against the project's policy. A real example, checking `requests` against a Permissive-only policy:

```
$ trustedlicenses check requests
Resolving requests and its transitive dependencies...
Checking 5 package(s) (requested plus transitive dependencies)...
✗ Disallowed or undetectable licenses in 1 of 5 packages:
  certifi: detected MPL-2.0 (categories: Copyleft Limited) -- from declared metadata
    -> add "Copyleft Limited" to allowed-categories, or "certifi" to ignored-packages, to allow this
```


## What it looks like

In this section, I show the output of a failing run, and the integration points, in order to make the error reporting concrete.

```
$ uv run trustedlicenses
Checking dependency licenses...
✗ Disallowed or undetectable licenses in 2 of 134 packages:
  certifi: detected MPL-2.0 (categories: Copyleft Limited) -- from declared metadata
    -> add "Copyleft Limited" to allowed-categories, or "certifi" to ignored-packages, to allow this
  fqdn: detected MPL-2.0 (categories: Copyleft Limited) -- from license files: LICENSE
    -> add "Copyleft Limited" to allowed-categories, or "fqdn" to ignored-packages, to allow this
```

Each failure names the package, the detected licence, the category, the source of the evidence (declared metadata or licence files), and a concrete change to the configuration that would allow it. The process exits non-zero on any failure. A pre-commit hook and a GitHub Action are provided:

```yaml
- repo: https://github.com/w-martin/trustedlicenses
  rev: v0.3.1
  hooks:
    - id: trustedlicenses
```

```yaml
- name: Check dependency licenses
  uses: w-martin/trustedlicenses@v0.3.1
```

Installation is `uv add --dev trustedlicenses` or `pip install trustedlicenses`. The typedframes repository migrated to it for the reasons given above (typedframes PR 70), and its dependency check passes all 85 packages of its development environment with no `ignored-packages`.

If the project declares its own licence in `[project.license]`, the narrow FSF-based notes appear separately from pass and fail. For example, a GPL-2.0-only project that depends on `scipy` (GPL-3.0-or-later in its bundled components) produces:

```
i 1 compatibility note(s) -- not a pass/fail result, see below:
  scipy: your project is GPL-2.0-only; scipy is GPL-3.0-or-later -- the FSF states
  GPLv2 is not, by itself, compatible with GPLv3 (https://www.gnu.org/licenses/gpl-faq.html#AllCompatibility)
```

## Other differences observed

In this section, I list further differences from running the tools, in order of relevance. The runs used a clean Python 3.14.4 environment on macOS, with the locked development environment of typedframes (116 distributions) and a broader data science, web and cloud environment (208 distributions).

1. **Unknown licences are reported with their evidence.** An internal-style package with no licence (a locally built wheel that declares nothing) was reported by `trustedlicenses` as `no license detected`, with a suggestion to verify it by hand. `licensecheck` listed it as a blank row with a cross, and in a separate table that contained only its name.
2. **The exit code of `licensecheck` is zero by default.** In the 208-distribution environment it listed three packages with a cross and exited with status 0. This is documented: `--zero` returns a non-zero code (status 1 here) and the help text describes it as 'ideal for CI/CD'. It nevertheless means that a bare invocation in a pipeline cannot fail.
3. **Warnings do not name the package.** Both environments produced `'ZLIB' License not identified so falling back to UNKNOWN` without naming the package. This is issue 144, open since 2026-04-29. Related open issues include 125 (a GPLv2-or-later dependency shown as `GNU GENERAL PUBLIC LICENSE V2;; LATER _GPLV2__` and judged incompatible with a GPLv3-or-later project), 86 (an MPL-2.0 dependency judged incompatible with a proprietary project) and 150 (a licence that can no longer be parsed, `nvidia-cudnn-cu12`).
4. **Display of licence names is altered.** Punctuation was replaced by underscores, so that `Apache License, Version 2.0` appeared as `Apache License_ Version 2.0`, and `OR` expressions were flattened: `packaging` declares `Apache-2.0 OR BSD-2-Clause` and was displayed as `Apache-2.0;; BSD-2-Clause`. I did not establish how the compatibility verdict treats the two.
5. **Scope differs.** `licensecheck` resolves the dependency list declared in `pyproject.toml`, whereas `trustedlicenses` audits whatever is installed. In the typedframes environment, `licensecheck` reported 105 of 116 installed distributions; the 11 unreported ones were the tools' own dependencies, which I had installed, so this is a difference in scope and not a miss on the project's own dependencies.

## Speed

In this section, I report what was measured and the limits of the measurement.

On the repository's benchmark environment of 425 installed distributions (data science, web, cloud and ML packages with full transitive trees; one Apple Silicon machine, three to five cold runs per tool), the median wall time was 1.29 seconds for `trustedlicenses`, 1.60 seconds for `pip-licenses` and 2.13 seconds for `licensecheck`. The text-matching fallback accounts for most of the work: the 96 bundled licence files take 7.47 seconds when matched serially. The Rust matcher releases the GIL for the duration of each scan, and the scans run across a thread pool, so the same environment completes in 1.29 seconds and not in 7.7 to 8.9 seconds.

The same ordering holds on a current interpreter. On Python 3.14.4 with the released wheels, five cold runs on the 116-distribution environment took 0.50 to 0.51 seconds for `trustedlicenses` and 0.76 to 0.77 seconds for `licensecheck`. On the 208-distribution environment, `trustedlicenses` took 1.03 to 1.08 seconds and `licensecheck` 1.20 to 1.42 seconds. These are single-machine timings from `/usr/bin/time -p`, and not a rigorous benchmark. Moreover, the tools were not given identical work: `licensecheck` resolved a declared dependency list, whereas `trustedlicenses` enumerated the installed environment and performed text matching where metadata was absent. A difference of this size is unlikely to decide a choice of tool.

<!-- REWRITE NOTE: an earlier run of mine, on Python 3.13 with the source tree's locally built extension, showed licensecheck as faster. That was an artefact of the setup and is not reflected here. -->

## When licensecheck is the better choice

In this section, I state the cases in which I would use the other tool.

`licensecheck` ships a general project-versus-dependency compatibility matrix over 27 licence variants, and `trustedlicenses` deliberately does not, because a category-level verdict risks a confident but wrong answer. A project that needs that matrix should use `licensecheck`. A project whose dependencies all declare a usable licence in their metadata gains less from the licence-file fallback, and `licensecheck` is more mature: `trustedlicenses` is v0.3.1 and marked experimental in its README. Finally, `trustedlicenses` is stricter, and flagged 9 of 208 packages in the broader environment that `licensecheck` accepted: `docutils` (a licence file that mixes a public-domain dedication with several third-party exceptions) and `jsonpatch` (declared as `Modified BSD License`) did not text-match, the five `sphinxcontrib-*` packages declare only the ambiguous classifier `License :: OSI Approved :: BSD License`, `catboost` needed a decision as described above, and `pylint` is GPL-2.0-or-later and failed the category policy. Each is resolved by an explicit decision and not silently passed, which is the intended behaviour for a sensitive project, but it does mean more review work.

## Limitations

The following limitations apply to the current release (v0.3.1).

- Detection can be wrong in both directions. Declared metadata can be inaccurate, and text matching is a similarity match with a threshold, so a verdict can be a false negative or a false positive.
- The categories are an editorial taxonomy derived from ScanCode Toolkit, and not an SPDX publication.
- Compatibility checking is intentionally narrow, as described above.
- A category-based policy cannot distinguish a change between two licences within an allowed category. The statement-level pin described above mitigates this only for packages that are pinned.
- The tool is not a lawyer and does not provide legal advice. The README carries a full disclaimer, which I modelled on the one in `licensecheck`.
- A plain check makes no network calls. `index-check` is a separate, opt-in command.

## References

- PEP 639, *Improving License Clarity with Better Package Metadata*: <https://peps.python.org/pep-0639/>
- The `spdx` Rust crate (Embark Studios): <https://docs.rs/spdx>, <https://github.com/EmbarkStudios/spdx>
- SPDX License List: <https://spdx.org/licenses/>
- Licensee (GitHub): <https://github.com/licensee/licensee>
- askalono: <https://github.com/jpeddicord/askalono>
- `licensecheck`: <https://github.com/FHPythonUtils/LicenseCheck> (issues 86, 121, 122, 125, 137, 144, 147, 150); releases: <https://pypi.org/project/licensecheck/#history>
- `pip-licenses`: <https://github.com/raimon49/pip-licenses>
- `liccheck`: <https://github.com/dhatim/python-license-check>, <https://pypi.org/project/liccheck/>
- `cargo-deny` changelog, 0.18.7 (PR 812): <https://github.com/EmbarkStudios/cargo-deny/blob/main/CHANGELOG.md>; `cargo-about`: <https://github.com/EmbarkStudios/cargo-about>
- PyPI implementation of PEP 639: <https://github.com/pypi/warehouse/issues/16620>
- FSF GPL FAQ, compatibility: <https://www.gnu.org/licenses/gpl-faq.html#AllCompatibility>
- trustedlicenses comparison and benchmark pages: <https://trustedlicenses.readthedocs.io/en/latest/comparison/>, <https://trustedlicenses.readthedocs.io/en/latest/performance/>


`trustedlicenses` is available on [PyPI](https://pypi.org/project/trustedlicenses/) and [GitHub](https://github.com/w-martin/trustedlicenses). It is v0.3.1 and marked experimental: the API and the configuration format may change, and detection can be wrong in the ways described above. The detection is not new work, since it applies the SPDX corpus, the `spdx` crate and the FSF's published guidance as a gate. Reports of cases in which it identifies a licence incorrectly are welcome as issues on the repository.
