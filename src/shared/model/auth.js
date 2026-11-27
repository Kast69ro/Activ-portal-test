/**
 * Слайс auth: токен, пользователь и роли; селекторы и проверка ролей (hasAnyRole).
 */
import { createSlice } from "@reduxjs/toolkit";

/*
 * Сессия пользователя. Хранится в localStorage под теми же ключами,
 * что и в прежней HR-системе (token / user / roles), — пользователям не придётся входить заново.
 */
const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return key === "token" ? raw : JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export const ADMIN_ROLES = ["admin", "superadmin"];

const normalizeRoles = (roles) =>
  (Array.isArray(roles) ? roles : roles ? [roles] : []).map((r) => String(r).trim().toLowerCase());

export const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: read("token", null),
    user: read("user", null),
    roles: read("roles", []),
  },
  reducers: {
    /** payload — объект data из ответа POST /Account/login */
    loggedIn: (state, { payload }) => {
      state.token = payload.jwToken;
      state.user = payload;
      state.roles = payload.roles ?? [];
    },
    loggedOut: (state) => {
      state.token = null;
      state.user = null;
      state.roles = [];
    },
  },
  selectors: {
    selectToken: (state) => state.token,
    selectUser: (state) => state.user,
    selectRoles: (state) => state.roles,
    selectIsAuthenticated: (state) => Boolean(state.token),
    selectIsAdmin: (state) => normalizeRoles(state.roles).some((r) => ADMIN_ROLES.includes(r)),
    /** Логин пользователя — нужен чату и статьям (заголовок Login) */
    selectLogin: (state) => (state.user?.userName ?? "").trim(),
  },
});

export const { loggedIn, loggedOut } = authSlice.actions;
export const { selectToken, selectUser, selectRoles, selectIsAuthenticated, selectIsAdmin, selectLogin } =
  authSlice.selectors;

/** Есть ли у пользователя хотя бы одна из ролей ("admin" покрывает и SuperAdmin) */
export const hasAnyRole = (userRoles, required) => {
  if (!required?.length) return true;
  const own = normalizeRoles(userRoles);
  return required.some((role) =>
    role === "admin" ? own.some((r) => ADMIN_ROLES.includes(r)) : own.includes(role.toLowerCase()),
  );
};

/** Сохраняет сессию в localStorage — вызывается из store при входе и выходе */
export function persistAuth({ token, user, roles }) {
  try {
    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("roles", JSON.stringify(roles));
    } else {
      ["token", "user", "roles"].forEach((key) => localStorage.removeItem(key));
    }
  } catch {
    /* localStorage недоступен */
  }
}

/** Имя для приветствия: «Имя Фамилия» или логин */
export const getDisplayName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || user?.userName || "";
