import Matter from "matter-js";

function download(src: string, name: string) {
  fetch(src)
    .then((response) => response.text())
    .then((string) => new DOMParser().parseFromString(string, "image/svg+xml"))
    .then((document) =>
      Array.from(document.querySelectorAll<SVGPathElement>("path"))
    )
    .then((paths) => {
      const vertices = paths.map((path) => Matter.Svg.pathToVertices(path));
      const file = new Blob([JSON.stringify(vertices)], { type: "text/json" });
      const anchor = document.createElement("a");
      anchor.href = URL.createObjectURL(file);
      anchor.download = name;
      anchor.textContent = name;
      document.body.appendChild(anchor);
    });
}
