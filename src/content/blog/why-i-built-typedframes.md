---
title: Why I built typedframes
date: 2026-06-06
description: Weakly typed column references have been a pet peeve for most of a decade. Here's the gap in current tooling, and how typedframes closes it.
---

I built a static type checker (both a standalone Rust binary and a mypy plugin) to catch
dataframe schema errors before they hit production. Here is why I built it, the gap in
current tooling, and how it works. For code examples, skip to the end.

I've been working in the data science (DS) space for nearly 10 years, and weakly typed
column references have been a pet peeve for most of that time. One character off and
pandas raises a KeyError at runtime; you find out in production on an edge case.

The way most teams handle the DS to production pipeline is: either a technical DS
deploys it themselves, or they throw the notebook over the fence to a machine learning
engineer (MLE). SageMaker and Vertex AI made the former common. An MLE's job is often to
rewrite it entirely: strip code smells, write tests against fake data, and catch schema
issues. Sculley et al.'s 2015 NeurIPS paper on ML technical debt documented how badly
this debt accumulates; AWS and Google platforms actively discourage the rewrite that
addresses it, because it creates friction that doesn't fit a scientist's workflow.

My team put together a shared setup around this. We pair with DS, write acceptance
tests, well-factored code, and things get caught. It works, but imperfectly. Scientists
find it unnatural, and acceptance tests give feedback only when someone actually runs
them or extends them to new logical branches. A code review takes hours to days. Things
still get missed.

Most ML code is Python. Type checkers are the things that actually reduce runtime
errors, but historically we were limited to mypy: strict, but slow. Recently, rust-based
tools (ty, pyrefly) have popped up, running sub-second. For human workflows, IDEs run
language servers that scan continuously; for agentic workflows, the same checker wired
into a pre-commit hook means code must pass before the human is involved.

I was previously tentative about enforcing strong type checking on scientists' code, as
I've observed it slowing workflows. However, the proportion of LLM-drafted code has
shifted considerably, and the guardrails that worked when humans wrote every line are no
longer adequate. LLMs replicate antipatterns. Copilot and human reviews of column
mismatches are not deterministic. Thus, we've ramped up CICD linting and type checking
rules (ruff, bandit, complexipy, ty, pyrefly) and love the results.

Unfortunately, it hasn't helped with dataframes. Type checkers don't test dataframe
contracts in pandas or polars. I raised issues in the ty tracker (#2551) and pyrefly
tracker (#2805). Both teams were interested but neither has near-term plans. This led me
to develop typedframes.

typedframes works in two modes. The simpler one needs no annotation:

```python
df = pd.read_csv("orders.csv", usecols=["order_id", "customer_name", "total"])

result = df["custmer_name"]  # error: did you mean 'customer_name'?
```

No retrofitting, no schema to write, though inference is narrower. For LLM generated
code I want harder edges. The stronger mode uses explicit annotations:

```python
def process(df: Annotated[pd.DataFrame, OrderSchema]) -> pd.Series:
    return df["custmer_name"]  # error: did you mean 'customer_name'?
```

The schema encodes hard expectations against every subscript, closer in spirit to a DTO
than to a runtime validator, and what I want LLMs writing against.

typedframes is available on pypi. There is a standalone rust checker running
sub-second, as well as a mypy plugin. I would rather ty or pyrefly built this natively;
I am not a type system author and the implementation has rough edges. However, this is a
proof of concept demonstrating that the gap is real and closeable.

*Originally posted as a comment on [Show HN: typedframes](https://news.ycombinator.com/item?id=48428732).*
