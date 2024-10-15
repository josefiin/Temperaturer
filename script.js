/*
Grundläggande Javascript Högskolan Väst
Examininationsuppgift VT 2024
Josefin Holgersson

Väder-applikation som hämtar data och visar min- och max-temperaturer över de senaste 7 dagarna för vald stad i en graf. Appen gör det möjligt för användaren att välja att se temperaturer för fyra olika städer.
*/

// Hämtar referens till ett div-element för eventuellt felmeddelande.
const errorText = document.getElementById("error");
// Funktion för att visa felmeddelande om data inte kan hämtas eller visas.
const errorDisplay = (error) => {
  // Ta bort graf om det finns en, vill inte att det ligger kvar graf med data från annan stad om inte data för klickad stad kan hämtas.
  if (chart) {
    chart.destroy();
    chart = null;
  }
  // Felmeddelande visas i konsollen.
  console.error("Något gick tyvärr fel:", error);
  // Felmeddelande skrivs ut.
  errorText.textContent = "Något gick tyvärr fel.";
  // Felmeddelande blir synligt.
  errorText.style.display = "block";
};

// Funktion för att hämta data från en api-url. Lägger in variabel med url som parameter.
async function getApi(apiUrl) {
  //Testa och kör kod om inget fel uppstår.
  try {
    const response = await fetch(apiUrl);
    // Kontrollerar om data kan hämtas.
    if (!response.ok) {
      throw new Error("Data kunde inte hämtas");
    }
    //Det som kommer in är bara en dataström som måste göras om till json-format.
    return await response.json();
    // Om fel uppstår ger error information om felet.
  } catch (error) {
    // Anropa errorDisplay-funktionen för att visa felmeddelandet.
    errorDisplay(error);
    // Returnerar null om hämtningen misslyckas.
    return null;
  }
}

// Skapar variabel för att spara referens till grafen
let chart;

// Global styling för grafen
Chart.defaults.font.family = '"JetBrains Mono", monospace';

// Egenskaper och styling för graf på max och mintemp
const minTempStyling = {
  label: "Lägsta temperatur",
  fill: true,
  backgroundColor: "rgba(105, 219, 198, 0.6)",
  borderColor: "rgb(105, 219, 198)",
};
const maxTempStyling = {
  label: "Högsta temperatur",
  // Vill ha bakgrundsfärg så sätter fill till true.
  fill: true,
  // Sätter bakgrundsfärg, 50 % opacitet
  backgroundColor: "rgba(174, 230, 83, 0.6)",
  borderColor: "rgb(174, 230, 83)",
};

// Här ligger jag till fler val och gör styling för grafen. Skapar en funktion för att kunna lägga till city som argument. Hittat info för varje inställning på Chart.js https://www.chartjs.org/docs/latest/configuration/
const createGraphOptions = (city) => ({
  responsive: true, // Gör så att grafen anpassar sig responsivt
  maintainAspectRatio: false, // Tillåter att grafens proportioner ändras.
  elements: {
    line: {
      borderWidth: 2,
    },
  },
  // "scales" refererar till de olika axlarna i grafen, x-axeln och y-axeln.
  scales: {
    x: {
      grid: {
        display: false, // Dölj rutnätet för x-axeln om det inte redan är dolt.
      },
      border: {
        display: false, // Döljer de yttre kantlinjerna för x-axeln
      },
    },
    y: {
      border: {
        display: false, // Döljer de yttre kantlinjerna för y-axeln
      },
    },
  },
  // Tension "rundar" data-punkterna i grafen.
  tension: 0.4,
  // Här lägger jag in en titel på grafen och justerar styling för den i min graf.
  plugins: {
    title: {
      display: true,
      color: "#10100e",
      text: "Temperaturer (°C) i " + city,
      padding: {
        top: 10,
        bottom: 40,
      },
      // Justerar text-storlek för title här.
      font: {
        size: 20,
        weight: "normal",
      },
    },
  },
});

// Funktion som skapar upp en ny graf. Skickar in JSON-data som argument.
// Har hämtat info och kikat på kodexempel om hur man skapar upp en graf på Chart.js. https://www.chartjs.org/docs/latest/getting-started/usage.html
const createChart = (tempData, city) => {
  chart = new Chart(document.getElementById("canvas-chart"), {
    type: "line",
    data: {
      // Använder "time" direkt från API-responsen, då det redan är på rätt format
      labels: tempData.daily.time,
      // Här anger jag vilka datasets jag vill visa.
      datasets: [
        {
          // Spreading av minTempStyling
          ...minTempStyling,
          // Pekar på rätt data(key) i API-responsen.
          data: tempData.daily.temperature_2m_min,
        },
        {
          // Spreading av maxTempStyling
          ...maxTempStyling,
          // Pekar på rätt data(key) i API-responsen.
          data: tempData.daily.temperature_2m_max,
        },
      ],
    },
    //  Med options kan jag göra fler val för min graf. För att separera det från funktionen createChart ligger det i en egen funktion.
    options: createGraphOptions(city),
  });
};

// Funktion för att uppdatera data i grafen. Ref: https://www.chartjs.org/docs/latest/developers/updates.html
const updateChartNewData = (tempData, city) => {
  try {
    //Kontrollerar först om det finns data.
    if (!tempData) {
      throw new Error("Data saknas");
    }
    // Om det inte finns en graf, kör funktion createChart.
    if (!chart) {
      createChart(tempData, city);
    } else {
      // Annars uppdatera dataset med nya temperaturer.
      chart.data.datasets[0].data = tempData.daily.temperature_2m_min;
      chart.data.datasets[1].data = tempData.daily.temperature_2m_max;

      // Uppdatera title med ny text
      chart.options.plugins.title.text = "Temperaturer (°C) i " + city;
      // Kör update på graf för att visa ny data.
      chart.update();
    }
    // Döljer felmeddelande om ny graf kan skapas upp.
    errorText.style.display = "none";
  } catch (error) {
    // Anropa errorDisplay-funktionen för att visa felmeddelandet.
    errorDisplay(error);
  }
};

// Funktion som hämtar väderdata från ett givet API-url och uppdaterar grafen med ny data för en specifik stad.
const updateChartForSelectedCity = async (url, title) => {
  try {
    // getApi med rätt argumentet(API-url) anropas. Sparar datan i en variabel.
    const stadData = await getApi(url);
    // Funktion körs för att uppdatera data i graf, skickar in data och namn på stad.
    updateChartNewData(stadData, title);
    // Om hämtning misslyckas, anropa errorDisplay-funktionen.
  } catch (error) {
    errorDisplay(error);
  }
};

const setActiveButton = (activeButtonId) => {
  // Hämtar refens till alla knappar.
  const buttons = document.querySelectorAll("button");

  // Loopar igenom alla knappar och tar bort .btn-active klassen
  buttons.forEach((button) => {
    button.classList.remove("btn-active");
  });
  // Lägger till .btn-active till den aktiva knappen
  document.getElementById(activeButtonId).classList.add("btn-active");
};

// Hämtar referenser till knappar och lägger till event listeners, kör funktion updateChartForSelectedCity.
document.getElementById("btn-huskvarna").addEventListener("click", () => {
  updateChartForSelectedCity(apiUrlHuskvarnaVader, "Huskvarna");
  setActiveButton("btn-huskvarna");
});

// Trollhättan
document.getElementById("btn-trollhattan").addEventListener("click", () => {
  updateChartForSelectedCity(apiUrlTrollhattanVader, "Trollhättan");
  setActiveButton("btn-trollhattan");
});

// Stockholm
document.getElementById("btn-sthlm").addEventListener("click", () => {
  updateChartForSelectedCity(apiUrlSthlmVader, "Stockholm");
  setActiveButton("btn-sthlm");
});

// Göteborg
document.getElementById("btn-gbg").addEventListener("click", () => {
  updateChartForSelectedCity(apUrlGbgVader, "Göteborg");
  setActiveButton("btn-gbg");
});

// Vill att det ska finnas en graf när sidan laddas med Huskvarnas data.
window.onload = () => {
  updateChartForSelectedCity(apiUrlHuskvarnaVader, "Huskvarna");
  setActiveButton("btn-huskvarna");
};

// Funktion för att byta diagramtyp.
const changeChartType = () => {
  // Hämtar det valda alternativets värde (diagramtyp) från användaren och sparar i en variabel.
  selectedChartType = document.getElementById("chart-select").value;
  // Uppdaterar diagramtypen med rätt värde. Config refererar till konfigurationsobjektet för diagrammet. https://www.chartjs.org/docs/latest/configuration/
  chart.config.type = selectedChartType;
  // Kör update på graf för att visa ny diagramtyp.
  chart.update();
};

// Select-elementet kör funktion changeChartType vid eventet "change".
document
  .getElementById("chart-select")
  .addEventListener("change", changeChartType);
