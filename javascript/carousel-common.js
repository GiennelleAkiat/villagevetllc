class DraggingEvent {
  constructor(target = undefined) {
    this.target = target;
  }

  event(callback) {
    let handler;

    this.target.addEventListener("mousedown", e => {
      e.preventDefault();

      handler = callback(e);

      window.addEventListener("mousemove", handler);
      document.addEventListener("mouseleave", clearDraggingEvent);
      window.addEventListener("mouseup", clearDraggingEvent);

      function clearDraggingEvent() {
        window.removeEventListener("mousemove", handler);
        window.removeEventListener("mouseup", clearDraggingEvent);
        document.removeEventListener("mouseleave", clearDraggingEvent);
        handler(null);
      }
    });

    this.target.addEventListener("touchstart", e => {
      handler = callback(e);

      window.addEventListener("touchmove", handler);
      window.addEventListener("touchend", clearDraggingEvent);
      document.body.addEventListener("mouseleave", clearDraggingEvent);

      function clearDraggingEvent() {
        window.removeEventListener("touchmove", handler);
        window.removeEventListener("touchend", clearDraggingEvent);
        handler(null);
      }
    });
  }

  getDistance(callback) {
    function distanceInit(e1) {
      let startingX, startingY;

      if ("touches" in e1) {
        startingX = e1.touches[0].clientX;
        startingY = e1.touches[0].clientY;
      } else {
        startingX = e1.clientX;
        startingY = e1.clientY;
      }

      return function(e2) {
        if (e2 === null) {
          return callback(null);
        } else {
          if ("touches" in e2) {
            return callback({
              x: e2.touches[0].clientX - startingX,
              y: e2.touches[0].clientY - startingY
            });
          } else {
            return callback({
              x: e2.clientX - startingX,
              y: e2.clientY - startingY
            });
          }
        }
      };
    }

    this.event(distanceInit);
  }
}

class GalleryCardCarousel extends DraggingEvent {
  constructor(container, controller = undefined) {
    super(container);

    this.container = container;
    this.controllerElement = controller;
    this.cards = container.querySelectorAll(".card");

    this.centerIndex = (this.cards.length - 1) / 2;
    this.cardWidth = (this.cards[0].offsetWidth / this.container.offsetWidth) * 100;
    this.xScale = {};

    window.addEventListener("resize", this.updateCardWidth.bind(this));

    if (this.controllerElement) {
      this.controllerElement.addEventListener("keydown", this.controller.bind(this));
    }

    this.build();

    super.getDistance(this.moveCards.bind(this));
  }

  updateCardWidth() {
    this.cardWidth = (this.cards[0].offsetWidth / this.container.offsetWidth) * 100;
    this.build();
  }

  build(fix = 0) {
    for (let i = 0; i < this.cards.length; i++) {
      const x = i - this.centerIndex;
      const scale = this.calcScale(x);
      const scale2 = this.calcScale2(x);
      const zIndex = -(Math.abs(i - this.centerIndex));
      const leftPos = this.calcPos(x, scale2);

      this.xScale[x] = this.cards[i];

      this.updateCards(this.cards[i], {
        x: x,
        scale: scale,
        leftPos: leftPos,
        zIndex: zIndex
      });
    }
  }

  controller(e) {
    e.preventDefault();
    const temp = { ...this.xScale };

    if (e.keyCode === 39) {
      // Right arrow
      for (let x in this.xScale) {
        const newX = parseInt(x) - 1 < -this.centerIndex
          ? this.centerIndex
          : parseInt(x) - 1;
        temp[newX] = this.xScale[x];
      }
    }

    if (e.keyCode === 37) {
      // Left arrow
      for (let x in this.xScale) {
        const newX = parseInt(x) + 1 > this.centerIndex
          ? -this.centerIndex
          : parseInt(x) + 1;
        temp[newX] = this.xScale[x];
      }
    }

    this.xScale = temp;

    for (let x in temp) {
      const scale = this.calcScale(x),
            scale2 = this.calcScale2(x),
            leftPos = this.calcPos(x, scale2),
            zIndex = -Math.abs(x);

      this.updateCards(this.xScale[x], {
        x: x,
        scale: scale,
        leftPos: leftPos,
        zIndex: zIndex
      });
    }
  }

  calcPos(x, scale) {
    let formula;

    if (x < 0) {
      formula = (scale * 100 - this.cardWidth) / 2;
    } else if (x > 0) {
      formula = 100 - (scale * 100 + this.cardWidth) / 2;
    } else {
      formula = 100 - (scale * 100 + this.cardWidth) / 2;
    }

    return formula;
  }

  updateCards(card, data) {
    if (data.x || data.x == 0) {
      card.setAttribute("data-x", data.x);
    }

    if (data.scale || data.scale == 0) {
      card.style.transform = `scale(${data.scale})`;
      card.style.opacity = data.scale == 0 ? 0 : 1;
    }

    if (data.leftPos != null) {
      card.style.left = `${data.leftPos}%`;
    }

    if (data.zIndex || data.zIndex == 0) {
      card.classList.toggle("highlight", data.zIndex == 0);
      card.style.zIndex = data.zIndex;
    }
  }

  calcScale2(x) {
    if (x <= 0) return 1 - (-1 / 5) * x;
    else return 1 - (1 / 5) * x;
  }

  calcScale(x) {
    const formula = 1 - (1 / 5) * Math.pow(x, 2);
    return formula <= 0 ? 0 : formula;
  }

  checkOrdering(card, x, xDist) {
    const original = parseInt(card.dataset.x);
    const rounded = Math.round(xDist);
    let newX = x;

    if (x !== x + rounded) {
      if (x + rounded > original) {
        if (x + rounded > this.centerIndex) {
          newX = (x + rounded - 1 - this.centerIndex) - rounded + -this.centerIndex;
        }
      } else if (x + rounded < original) {
        if (x + rounded < -this.centerIndex) {
          newX = (x + rounded + 1 + this.centerIndex) - rounded + this.centerIndex;
        }
      }
      this.xScale[newX + rounded] = card;
    }

    const temp = -Math.abs(newX + rounded);
    this.updateCards(card, { zIndex: temp });
    return newX;
  }

  moveCards(data) {
    let xDist;

    if (data != null) {
      this.container.classList.remove("smooth-return");
      xDist = data.x / 250;
    } else {
      this.container.classList.add("smooth-return");
      xDist = 0;

      for (let x in this.xScale) {
        this.updateCards(this.xScale[x], {
          x: x,
          zIndex: Math.abs(Math.abs(x) - this.centerIndex)
        });
      }
    }

    for (let i = 0; i < this.cards.length; i++) {
      const currentX = parseInt(this.cards[i].dataset.x);
      const x = this.checkOrdering(this.cards[i], currentX, xDist),
            scale = this.calcScale(x + xDist),
            scale2 = this.calcScale2(x + xDist),
            leftPos = this.calcPos(x + xDist, scale2);

      this.updateCards(this.cards[i], {
        scale: scale,
        leftPos: leftPos
      });
    }
  }
}

// Optional subclass – identical to GalleryCardCarousel, kept for naming clarity
class ClientTestCardCarousel extends GalleryCardCarousel {
  build(fix = 0) {
    // If even, clone the first card to make it odd
    if (this.cards.length % 2 === 0) {
      const clone = this.cards[0].cloneNode(true);
      this.container.appendChild(clone);
      this.cards = this.container.querySelectorAll('.card');
      this.centerIndex = (this.cards.length - 1) / 2;
    }

    // Parent build logic (places cards with integer offsets)
    for (let i = 0; i < this.cards.length; i++) {
      const x = i - this.centerIndex;
      const scale = this.calcScale(x);
      const scale2 = this.calcScale2(x);
      const zIndex = -(Math.abs(i - this.centerIndex));
      const leftPos = this.calcPos(x, scale2);

      this.xScale[x] = this.cards[i];
      this.updateCards(this.cards[i], { x, scale, leftPos, zIndex });
    }
  }

 moveCards(data) {
    let xDist;

    if (data != null) {
      this.container.classList.remove("smooth-return");
      xDist = data.x / 250;
    } else {
      this.container.classList.add("smooth-return");
      xDist = 0;

      // Use the same z-index as build(), not the original fancy formula
      for (let x in this.xScale) {
        const numericX = parseInt(x);
        this.updateCards(this.xScale[x], {
          x: x,
          zIndex: -(Math.abs(numericX))
        });
      }
    }

    for (let i = 0; i < this.cards.length; i++) {
      const currentX = parseInt(this.cards[i].dataset.x);
      const x = this.checkOrdering(this.cards[i], currentX, xDist),
            scale = this.calcScale(x + xDist),
            scale2 = this.calcScale2(x + xDist),
            leftPos = this.calcPos(x + xDist, scale2);

      this.updateCards(this.cards[i], { scale, leftPos });
    }
  }
  // Spacing: smaller factor = wider spread
  calcScale2(x) {
    const factor = 3;   // try 2.5, 3, 3.5
    if (x <= 0) return 1 - (-1 / factor) * x;
    else        return 1 -  (1 / factor) * x;
  }

  // Show only the centre card and its immediate neighbours
  calcScale(x) {
    if (Math.abs(x) > 1) return 0;                   // hide outer cards
    const formula = 1 - (1 / 4) * Math.pow(x, 2);    // original scale curve
    return formula <= 0 ? 0 : formula;
  }
}