// script para o canvas
const canvas = document.querySelector(".petition-container canvas");
const ctx = canvas.getContext("2d");
const button = document.querySelector(".submit-button");

const mousedownHandler = e => {
    let mouseX = e.offsetX;
    let mouseY = e.offsetY;

    ctx.beginPath();
    ctx.moveTo(mouseX, mouseY);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "black";
    canvas.addEventListener("mousemove", mousemoveHandler);
}
    
const mousemoveHandler = e => {
    let canvasWidth = e.target.width;
    let canvasHeight = e.target.height;
    let mouseMoveX = e.offsetX;
    let mouseMoveY = e.offsetY;

    if (mouseMoveX < 1 || mouseMoveY < 1) {
        ctx.closePath();
        canvas.removeEventListener("mousemove", mousemoveHandler);
    } else if (mouseMoveX > canvasWidth || mouseMoveY > canvasHeight) {
        ctx.closePath();
        canvas.removeEventListener("mousemove", mousemoveHandler);
    } else {
        ctx.lineTo(mouseMoveX, mouseMoveY);
        ctx.stroke();
    }
        
    canvas.addEventListener("mouseup", () => {
        ctx.closePath();
        canvas.removeEventListener("mousemove", mousemoveHandler)
    });
}

const clickHandler = e => {
    const canvasData = canvas.toDataURL();
    console.log(canvasData)
    document.querySelector('input[type="hidden"]').value = canvasData;
}

canvas.addEventListener("mousedown", mousedownHandler);
button.addEventListener("click", clickHandler);