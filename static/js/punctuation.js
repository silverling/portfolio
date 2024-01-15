function adjustCJKPunctuation(node) {
  const wrap = text => `<span class="font-halt">${text}</span>`;

  const sourceText = node.innerHTML;
  let targetText = sourceText
    .replaceAll("）", wrap("）"))
    .replaceAll("（", wrap("（"));
  node.innerHTML = targetText;
}

const node = document.querySelector(".post-content");
if (node) {
  adjustCJKPunctuation(node);
}
