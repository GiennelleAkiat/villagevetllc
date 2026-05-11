    document.addEventListener("DOMContentLoaded", function () {
  const container = document.querySelector(".gallery-card-carousel");
  const controller = document.querySelector(".gallery-card-carousel + .card-controller");

  if (container) {
    new GalleryCardCarousel(container, controller);
  }
});