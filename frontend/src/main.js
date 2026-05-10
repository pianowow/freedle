import { createApp } from "vue";
import { createPinia } from "pinia";
import "./style.css";
import App from "./App.vue";

document.documentElement.dataset.theme = "dark";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.mount("#app");
