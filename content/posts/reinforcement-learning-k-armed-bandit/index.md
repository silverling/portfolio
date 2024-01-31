---
title: "强化学习：K-Armed Bandit"
date: 2023-08-13T20:37:45+08:00
draft: false
categories: "Machine Learning"
---

想象一下，在你面前有一台老虎机（**Bandit**），老虎机上有一个拉杆（ref as **Action**）。每次拉动拉杆，你会得到一个分数（**Reward**），这个分数产生自一个随机分布。在玩了几局之后，你很快就能估计出分数的期望值，并知道了再玩下去是亏是赢。

假设一台老虎机有 K 个拉杆，每个拉杆背后能获得的分数的随机分布各不相同，在有限次数内，每次拉动一个拉杆，你该如何选择来使得获得的总分数最大？

## 贪心策略（Greedy）

最容易想到的是贪心策略。在当前时刻 $t$，如果我们已知每个 Action 的期望 Reward，那么可以直接选择期望最大的 Action，但期望 Reward 往往是不知道的。

$$
q_{*}(a) \ \dot{=} \ \mathbb{E}[R_t|A_t=a]
$$

$q_{*}(a)$ 表示在时刻 $t$ 采取 Action $A_t$ 获得的 Reward $R_t$ 的期望值。

不过我们可以利用已经的获得的 Reward，来**估计**采取每个 Action 能获得的期望 Reward。

$$
Q_t(a) \ \dot{=} \ \frac{\sum_{i=1}^{t} R_i \cdot \mathbf{1}_ {A_{i}=a}}{\sum_{i=1}^{t} \mathbf{1}_ {A_{i}=a}}
$$

## 随机探索的贪心策略（$\epsilon$-Greedy）

未完待续...