document.addEventListener("DOMContentLoaded", function () {
  const containers = document.querySelectorAll(".testimony-card-carousel");
  const controller = document.querySelector(".card-controller");
  const controllerMobile = document.querySelector(".card-controller-mobile");

  containers.forEach(function(container) {
    const isMobile = container.closest(".mobile-layout") !== null;
    new ClientTestCardCarousel(container, isMobile ? controllerMobile : controller);
  });
});