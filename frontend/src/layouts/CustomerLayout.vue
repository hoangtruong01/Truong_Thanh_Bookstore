<template>
  <div class="min-h-screen flex flex-col bg-slate-50">
    <SiteHeader
      :categories="allCategories"
      :is-dark-mode="isDarkMode"
      :current-locale="currentLocale"
      @open-profile="showProfile = true"
      @toggle-dark-mode="toggleDarkMode"
      @change-locale="changeLocale"
    />

    <!-- Main Content Area -->
    <main class="flex-grow">
      <router-view />
    </main>

    <SiteFooter />

    <!-- Profile Modal -->
    <ProfileModal :is-open="showProfile" @close="showProfile = false" />

    <!-- FAQ Chatbot Widget -->
    <ChatWidget />

    <!-- Website Opening Entry Ad Popup -->
    <EntryAdPopup />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { categoryService } from "@/services/category.service";
import type { Category } from "@/types";
import ProfileModal from "@/components/ProfileModal.vue";
import ChatWidget from "@/components/ChatWidget.vue";
import EntryAdPopup from "@/components/EntryAdPopup.vue";
import SiteHeader from "@/components/customer/layout/SiteHeader.vue";
import SiteFooter from "@/components/customer/layout/SiteFooter.vue";

const showProfile = ref(false);
const allCategories = ref<Category[]>([]);

// Locale
const { locale } = useI18n();
const currentLocale = computed(() => locale.value);

function changeLocale(lang: "vi" | "en") {
  locale.value = lang;
  localStorage.setItem("lang", lang);
  document.documentElement.setAttribute("lang", lang);
}

// Dark Mode logic
const isDarkMode = ref(localStorage.getItem("theme") === "dark");
function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value;
  if (isDarkMode.value) {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  } else {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }
}

// Cross-tab theme and language synchronization
function handleStorageChange(event: StorageEvent) {
  if (event.key === "theme") {
    const isDark = event.newValue === "dark";
    isDarkMode.value = isDark;
    document.documentElement.classList.toggle("dark", isDark);
  } else if (event.key === "lang") {
    const newLang = (event.newValue || "vi") as "vi" | "en";
    locale.value = newLang;
    document.documentElement.setAttribute("lang", newLang);
  }
}

async function loadCategories() {
  try {
    const res: any = await categoryService.getAll();
    const raw = res.data?.data || res.data;
    allCategories.value = Array.isArray(raw) ? raw : [];
  } catch {
    allCategories.value = [];
  }
}

onMounted(() => {
  // Initialize theme & language states from localStorage on mount
  isDarkMode.value = localStorage.getItem("theme") === "dark";
  document.documentElement.classList.toggle("dark", isDarkMode.value);

  locale.value = (localStorage.getItem("lang") || "vi") as "vi" | "en";
  document.documentElement.setAttribute("lang", locale.value);

  // Sync state reactively across open tabs/windows
  window.addEventListener("storage", handleStorageChange);

  loadCategories();
});

onUnmounted(() => {
  window.removeEventListener("storage", handleStorageChange);
});
</script>
