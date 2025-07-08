const socket = io();

// Referencias DOM
const salasContainer = document.getElementById("salas-container");
const mensajePopupInput = document.getElementById("mensaje-popup");
const salaPopupSelect = document.getElementById("sala-popup");
const botonEnviarPopup = document.getElementById("enviar-popup");
const salaComprobanteSelect = document.getElementById("sala-comprobante");
const inputComprobante = document.getElementById("comprobante");
const botonSubirComprobante = document.getElementById("subir-comprobante");

// Generar 20 salas visuales
for (let i = 1; i <= 20; i++) {
  const div = document.createElement("div");
  div.classList.add("sala");
  div.id = `sala-${i}`;
  div.textContent = `Sala ${i}`;
  div.style.backgroundColor = "red"; // Estado inicial: vacía
  salasContainer.appendChild(div);

  // También agregar al selector de salas
  const option1 = document.createElement("option");
  option1.value = `sala${i}`;
  option1.textContent = `Sala ${i}`;
  salaPopupSelect.appendChild(option1);

  const option2 = document.createElement("option");
  option2.value = `sala${i}`;
  option2.textContent = `Sala ${i}`;
  salaComprobanteSelect.appendChild(option2);
}

// Actualizar color según estado recibido
socket.on("estado_sala", (data) => {
  // data = { sala: "sala1", jugadores: 3 }
  const divSala = document.getElementById(data.sala.replace("sala", "sala-"));
  if (divSala) {
    if (data.jugadores === 0) {
      divSala.style.backgroundColor = "red";
    } else if (data.jugadores < 5) {
      divSala.style.backgroundColor = "yellow";
    } else {
      divSala.style.backgroundColor = "green";
    }
  }
});

// Enviar mensaje popup a sala
botonEnviarPopup.addEventListener("click", () => {
  const mensaje = mensajePopupInput.value.trim();
  const sala = salaPopupSelect.value;
  if (mensaje && sala) {
    socket.emit("mensaje_popup", { sala, mensaje });
    mensajePopupInput.value = "";
    alert("✅ Mensaje enviado a " + sala);
  }
});

// Subir comprobante
botonSubirComprobante.addEventListener("click", async () => {
  const sala = salaComprobanteSelect.value;
  const archivo = inputComprobante.files[0];
  if (!archivo || !sala) return alert("📎 Selecciona un archivo y una sala");

  const formData = new FormData();
  formData.append("comprobante", archivo);
  formData.append("sala", sala);
  formData.append("nombre", "ADMIN");
  formData.append("yape", "000000000");
  formData.append("mensaje", "Premio al ganador");

  try {
    const res = await fetch("/subir", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    alert("✅ Comprobante enviado");
    inputComprobante.value = "";
  } catch (err) {
    console.error("Error al subir comprobante:", err);
    alert("❌ Error al subir");
  }
});
