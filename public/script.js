// script.js

async function analyzeManualInput() {
    const ingredients = document.getElementById("manualInput").value;
    if (!ingredients) return alert("Please enter ingredients");
  
    sessionStorage.setItem("ingredients", ingredients);
    window.location.href = "result.html";
  }
  
  async function analyzeBarcode() {
    const barcode = document.getElementById("barcodeInput").value;
    if (!barcode) return alert("Please enter barcode");
  
    try {
      const response = await fetch(`http://localhost:3000/barcode/${barcode}`);
      const data = await response.json();
      if (data.ingredients) {
        sessionStorage.setItem("ingredients", data.ingredients);
        window.location.href = "result.html";
      } else {
        alert("Product not found or no ingredients available.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to analyze barcode");
    }
  }
  
  async function analyzeImage() {
    const fileInput = document.getElementById("imageInput");
    if (!fileInput.files.length) return alert("Please select an image");
  
    const formData = new FormData();
    formData.append("image", fileInput.files[0]);
  
    try {
      const response = await fetch("http://localhost:3000/ocr", {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      if (data.ingredients) {
        sessionStorage.setItem("ingredients", data.ingredients);
        window.location.href = "result.html";
      } else {
        alert("Failed to extract ingredients from image");
      }
    } catch (err) {
      console.error(err);
      alert("Error during OCR processing");
    }
  }
  
  // result.html behavior
  if (window.location.pathname.includes("result.html")) {
    const ingredients = sessionStorage.getItem("ingredients");
    document.getElementById("ingredientSummary").textContent = `Ingredients: ${ingredients}`;
  
    fetch("http://localhost:3000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients })
    })
      .then(res => res.json())
      .then(data => {
        const result = data.result;
        document.getElementById("resultText").textContent = `Result: ${result}`;
        const imgMap = {
          Good: "images/good.png",
          Neutral: "images/neutral.png",
          Bad: "images/bad.png"
        };
        document.getElementById("resultImage").src = imgMap[result] || imgMap["Neutral"];
      })
      .catch(err => {
        console.error(err);
        document.getElementById("resultText").textContent = "Error analyzing ingredients.";
      });
  }
  