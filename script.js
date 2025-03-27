let slideIndex = 0;
const slides = document.querySelectorAll(".slide");
const dots = document.querySelectorAll(".dot");

function moveSlide(step) {
    slideIndex += step;
    if (slideIndex >= slides.length) slideIndex = 0;
    if (slideIndex < 0) slideIndex = slides.length - 1;
    updateCarousel();
}

function setSlide(index) {
    slideIndex = index;
    updateCarousel();
}

function updateCarousel() {
    document.querySelector(".carousel").style.transform = `translateX(${-slideIndex * 100}%)`;
    dots.forEach(dot => dot.classList.remove("active"));
    dots[slideIndex].classList.add("active");
}

// Auto Slide
setInterval(() => moveSlide(1), 4000);

// Clickable Category Buttons
function openCategory(category) {
    alert(`Opening ${category} page!`);
}
