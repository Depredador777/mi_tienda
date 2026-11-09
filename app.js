
// ==========================================
// 1. CONEXIÓN CON SUPABASE
// ==========================================

// REEMPLAZA ESTOS VALORES POR LOS DE TU PROYECTO

const SUPABASE_URL = "https://tlksjtypxjhijtifkjsd.supabase.co";

const SUPABASE_KEY = "sb_publishable_bH0FFPpDEvPZ62fXdO2RvQ_tOhMwlqB";

const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ==========================================
// 2. ELEMENTOS HTML
// ==========================================

const loginSection = document.getElementById("loginSection");
const appSection = document.getElementById("appSection");

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const loginMessage = document.getElementById("loginMessage");
const userEmail = document.getElementById("userEmail");
const logoutButton = document.getElementById("logoutButton");

const productForm = document.getElementById("productForm");
const productName = document.getElementById("productName");
const productPrice = document.getElementById("productPrice");

const formTitle = document.getElementById("formTitle");
const saveButton = document.getElementById("saveButton");
const cancelButton = document.getElementById("cancelButton");

const productMessage = document.getElementById("productMessage");
const productList = document.getElementById("productList");
const productCount = document.getElementById("productCount");

const searchInput = document.getElementById("searchInput");


// ==========================================
// 3. VARIABLES
// ==========================================

let productos = [];

let productoEditando = null;


// ==========================================
// 4. INICIAR SESIÓN
// ==========================================

loginForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    loginMessage.textContent = "Ingresando...";

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    const { error } = await db.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        loginMessage.textContent = "Error: " + error.message;
        return;
    }

    loginMessage.textContent = "";

});


// ==========================================
// 5. CERRAR SESIÓN
// ==========================================

logoutButton.addEventListener("click", async function() {

    const { error } = await db.auth.signOut();

    if (error) {
        alert("No se pudo cerrar la sesión.");
    }

});


// ==========================================
// 6. CONTROLAR LA SESIÓN
// ==========================================

db.auth.onAuthStateChange(function(event, session) {

    if (session) {

        loginSection.hidden = true;
        appSection.hidden = false;

        userEmail.textContent = session.user.email;

        cargarProductos();

    } else {

        loginSection.hidden = false;
        appSection.hidden = true;

        productos = [];
        productoEditando = null;

        productList.innerHTML = "";

        loginForm.reset();
        productForm.reset();

        cancelarEdicion();

    }

});


// ==========================================
// 7. CARGAR PRODUCTOS
// ==========================================

async function cargarProductos() {

    productList.textContent = "Cargando productos...";

    const { data, error } = await db
        .from("productos")
        .select("*")
        .order("nombre", { ascending: true });

    if (error) {

        productList.textContent = "Error al cargar productos.";

        console.error(error);

        return;

    }

    productos = data;

    mostrarProductos();

}


// ==========================================
// 8. MOSTRAR PRECIOS EN BOLIVIANOS
// ==========================================

function formatoPrecio(precio) {

    return Number(precio).toLocaleString("es-BO", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }) + " Bs";

}


// ==========================================
// 9. MOSTRAR PRODUCTOS
// ==========================================

function mostrarProductos() {

    productList.innerHTML = "";

    const busqueda = searchInput.value
        .trim()
        .toLowerCase();

    const encontrados = productos.filter(function(producto) {

        return producto.nombre
            .toLowerCase()
            .includes(busqueda);

    });

    productCount.textContent =
        encontrados.length + " productos encontrados";

    if (encontrados.length === 0) {

        const mensaje = document.createElement("p");

        mensaje.className = "empty-message";

        mensaje.textContent = "No se encontraron productos.";

        productList.appendChild(mensaje);

        return;

    }

    encontrados.forEach(function(producto) {

        const item = document.createElement("div");

        item.className = "product-item";

        const info = document.createElement("div");

        info.className = "product-info";

        const nombre = document.createElement("p");

        nombre.className = "product-name";

        nombre.textContent = producto.nombre;

        const precio = document.createElement("p");

        precio.className = "product-price";

        precio.textContent = formatoPrecio(producto.precio);

        info.appendChild(nombre);

        info.appendChild(precio);


        // BOTONES DE ACCIONES

        const acciones = document.createElement("div");

        acciones.className = "product-actions";

        const editar = document.createElement("button");

        editar.className = "edit-button";

        editar.textContent = "Editar";

        editar.addEventListener("click", function() {

            prepararEdicion(producto);

        });


        const eliminar = document.createElement("button");

        eliminar.className = "delete-button";

        eliminar.textContent = "Eliminar";

        eliminar.addEventListener("click", function() {

            eliminarProducto(producto.id);

        });


        acciones.appendChild(editar);

        acciones.appendChild(eliminar);

        item.appendChild(info);

        item.appendChild(acciones);

        productList.appendChild(item);

    });

}


// ==========================================
// 10. BUSCADOR
// ==========================================

searchInput.addEventListener("input", function() {

    mostrarProductos();

});


// ==========================================
// 11. AGREGAR O ACTUALIZAR PRODUCTO
// ==========================================

productForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const nombre = productName.value.trim();

    const precio = Number(productPrice.value);

    if (!nombre || !Number.isFinite(precio) || precio < 0) {

        productMessage.textContent =
            "Introduce un nombre y un precio válido.";

        return;

    }

    saveButton.disabled = true;

    saveButton.textContent = "Guardando...";

    let error;


    // SI ESTAMOS EDITANDO

    if (productoEditando !== null) {

        ({ error } = await db
            .from("productos")
            .update({
                nombre: nombre,
                precio: precio
            })
            .eq("id", productoEditando));

    }

    // SI ESTAMOS AGREGANDO

    else {

        ({ error } = await db
            .from("productos")
            .insert({
                nombre: nombre,
                precio: precio
            }));

    }


    saveButton.disabled = false;

    saveButton.textContent =
        productoEditando !== null
            ? "Guardar cambios"
            : "Agregar producto";


    if (error) {

        productMessage.textContent =
            "Error al guardar el producto.";

        console.error(error);

        return;

    }


    productMessage.textContent = "Producto guardado correctamente.";

    productForm.reset();

    cancelarEdicion();

    await cargarProductos();

});


// ==========================================
// 12. PREPARAR EDICIÓN
// ==========================================

function prepararEdicion(producto) {

    productoEditando = producto.id;

    productName.value = producto.nombre;

    productPrice.value = producto.precio;

    formTitle.textContent = "Editar producto";

    saveButton.textContent = "Guardar cambios";

    cancelButton.hidden = false;

    productMessage.textContent =
        "Editando: " + producto.nombre;

    productForm.scrollIntoView({
        behavior: "smooth"
    });

}


// ==========================================
// 13. CANCELAR EDICIÓN
// ==========================================

function cancelarEdicion() {

    productoEditando = null;

    formTitle.textContent = "Agregar producto";

    saveButton.textContent = "Agregar producto";

    cancelButton.hidden = true;

}


cancelButton.addEventListener("click", function() {

    productForm.reset();

    cancelarEdicion();

    productMessage.textContent = "";

});


// ==========================================
// 14. ELIMINAR PRODUCTO
// ==========================================

async function eliminarProducto(id) {

    const confirmar = confirm(
        "¿Estás seguro de eliminar este producto?"
    );

    if (!confirmar) {

        return;

    }

    const { error } = await db
        .from("productos")
        .delete()
        .eq("id", id);

    if (error) {

        alert("No se pudo eliminar el producto.");

        console.error(error);

        return;

    }

    if (productoEditando === id) {

        productForm.reset();

        cancelarEdicion();

    }

    await cargarProductos();

}
