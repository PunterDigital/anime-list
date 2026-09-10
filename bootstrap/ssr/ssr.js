import { defineComponent, computed, mergeProps, useSSRContext, ref, resolveComponent, withCtx, createTextVNode, unref, watch, onUnmounted, toDisplayString, onScopeDispose, onMounted, onBeforeUnmount, createVNode, withDirectives, vModelText, openBlock, createBlock, createCommentVNode, resolveDynamicComponent, Fragment, renderList, reactive, createSSRApp, h as h$1 } from "vue";
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderSlot, ssrRenderList, ssrRenderAttr, ssrIncludeBooleanAttr, ssrRenderClass, ssrLooseContain, ssrRenderStyle, ssrRenderVNode, ssrLooseEqual, renderToString } from "vue/server-renderer";
import { usePage, useForm, router, Link, createInertiaApp, Head } from "@inertiajs/vue3";
import Toast from "primevue/toast";
import { useToast } from "primevue/usetoast";
import axios from "axios";
import { useQueryClient, useMutation, useQuery, VueQueryPlugin } from "@tanstack/vue-query";
import Dialog from "primevue/dialog";
import Select from "primevue/select";
import Slider from "primevue/slider";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import Button from "primevue/button";
import ProgressBar from "primevue/progressbar";
import { platformAuthenticatorIsAvailable, browserSupportsWebAuthnAutofill, browserSupportsWebAuthn, startRegistration, startAuthentication } from "@simplewebauthn/browser";
import { ofetch } from "ofetch";
import ToggleSwitch from "primevue/toggleswitch";
import Password from "primevue/password";
import createServer from "@inertiajs/vue3/server";
import { createPinia } from "pinia";
import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";
import Aura from "@primevue/themes/aura";
const _sfc_main$W = /* @__PURE__ */ defineComponent({
  __name: "UserAvatar",
  __ssrInlineRender: true,
  props: {
    name: {},
    avatarUrl: { default: null },
    size: { default: "md" }
  },
  setup(__props) {
    const props = __props;
    const sizeClasses = computed(() => {
      switch (props.size) {
        case "sm":
          return "w-8 h-8 text-xs";
        case "lg":
          return "w-20 h-20 text-2xl";
        default:
          return "w-10 h-10 text-sm";
      }
    });
    const initials = computed(() => {
      return props.name.split(/\s+/).slice(0, 2).map((w2) => w2[0]?.toUpperCase() ?? "").join("");
    });
    const bgColor = computed(() => {
      let hash = 0;
      for (const char of props.name) {
        hash = char.charCodeAt(0) + ((hash << 5) - hash);
      }
      const hue = Math.abs(hash) % 360;
      return `hsl(${hue}, 50%, 40%)`;
    });
    return (_ctx, _push, _parent, _attrs) => {
      if (__props.avatarUrl) {
        _push(`<img${ssrRenderAttrs(mergeProps({
          src: __props.avatarUrl,
          alt: __props.name,
          class: ["rounded-full object-cover", sizeClasses.value]
        }, _attrs))}>`);
      } else {
        _push(`<div${ssrRenderAttrs(mergeProps({
          class: ["rounded-full flex items-center justify-center font-semibold text-white", sizeClasses.value],
          style: { backgroundColor: bgColor.value }
        }, _attrs))}>${ssrInterpolate(initials.value)}</div>`);
      }
    };
  }
});
const _sfc_setup$W = _sfc_main$W.setup;
_sfc_main$W.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/UserAvatar.vue");
  return _sfc_setup$W ? _sfc_setup$W(props, ctx) : void 0;
};
function useFeature(name) {
  const page = usePage();
  return computed(() => page.props.features?.[name] ?? false);
}
const _sfc_main$V = /* @__PURE__ */ defineComponent({
  __name: "AppNavbar",
  __ssrInlineRender: true,
  props: {
    user: {},
    isAuthenticated: { type: Boolean }
  },
  setup(__props) {
    const showPlaylists = useFeature("playlists");
    const showDropdown = ref(false);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Link = resolveComponent("Link");
      _push(`<nav${ssrRenderAttrs(mergeProps({ class: "border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50" }, _attrs))}><div class="container mx-auto px-4 flex items-center justify-between h-16"><div class="flex items-center gap-6">`);
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("home"),
        class: "text-xl font-bold text-primary-400"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`AniTrack`);
          } else {
            return [
              createTextVNode("AniTrack")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div class="hidden md:flex items-center gap-4">`);
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("seasonal"),
        class: "text-gray-400 hover:text-gray-100 transition"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Seasonal`);
          } else {
            return [
              createTextVNode("Seasonal")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("schedule"),
        class: "text-gray-400 hover:text-gray-100 transition"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Schedule`);
          } else {
            return [
              createTextVNode("Schedule")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("top.rated"),
        class: "text-gray-400 hover:text-gray-100 transition"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Top`);
          } else {
            return [
              createTextVNode("Top")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("anime.index"),
        class: "text-gray-400 hover:text-gray-100 transition"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Browse`);
          } else {
            return [
              createTextVNode("Browse")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div><div class="flex items-center gap-4">`);
      if (__props.isAuthenticated && __props.user) {
        _push(`<!--[-->`);
        _push(ssrRenderComponent(_component_Link, {
          href: _ctx.route("list"),
          class: "text-gray-400 hover:text-gray-100 transition"
        }, {
          default: withCtx((_2, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`My List`);
            } else {
              return [
                createTextVNode("My List")
              ];
            }
          }),
          _: 1
        }, _parent));
        if (unref(showPlaylists)) {
          _push(ssrRenderComponent(_component_Link, {
            href: _ctx.route("playlists.index"),
            class: "text-gray-400 hover:text-gray-100 transition"
          }, {
            default: withCtx((_2, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`Playlists`);
              } else {
                return [
                  createTextVNode("Playlists")
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="relative"><button class="flex items-center gap-2 text-gray-400 hover:text-gray-100 transition">`);
        _push(ssrRenderComponent(_sfc_main$W, {
          name: __props.user.name,
          "avatar-url": __props.user.avatar_url,
          size: "sm"
        }, null, _parent));
        _push(`<span class="hidden sm:inline">${ssrInterpolate(__props.user.name)}</span></button>`);
        if (showDropdown.value) {
          _push(`<div class="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1">`);
          _push(ssrRenderComponent(_component_Link, {
            href: _ctx.route("profile.show", { user: __props.user.username }),
            class: "block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-gray-100"
          }, {
            default: withCtx((_2, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(` Profile `);
              } else {
                return [
                  createTextVNode(" Profile ")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(ssrRenderComponent(_component_Link, {
            href: _ctx.route("settings"),
            class: "block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-gray-100"
          }, {
            default: withCtx((_2, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(` Settings `);
              } else {
                return [
                  createTextVNode(" Settings ")
                ];
              }
            }),
            _: 1
          }, _parent));
          if (__props.user.is_admin) {
            _push(ssrRenderComponent(_component_Link, {
              href: _ctx.route("admin.dashboard"),
              class: "block px-4 py-2 text-sm text-primary-400 hover:bg-gray-800 hover:text-primary-300"
            }, {
              default: withCtx((_2, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(` Admin `);
                } else {
                  return [
                    createTextVNode(" Admin ")
                  ];
                }
              }),
              _: 1
            }, _parent));
          } else {
            _push(`<!---->`);
          }
          _push(`<hr class="border-gray-700 my-1"><button class="block w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-100"> Logout </button></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><!--]-->`);
      } else {
        _push(`<!--[-->`);
        _push(ssrRenderComponent(_component_Link, {
          href: _ctx.route("login"),
          class: "text-gray-400 hover:text-gray-100 transition"
        }, {
          default: withCtx((_2, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Login`);
            } else {
              return [
                createTextVNode("Login")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(_component_Link, {
          href: _ctx.route("register"),
          class: "bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition text-sm"
        }, {
          default: withCtx((_2, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Sign Up`);
            } else {
              return [
                createTextVNode("Sign Up")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<!--]-->`);
      }
      _push(`</div></div></nav>`);
    };
  }
});
const _sfc_setup$V = _sfc_main$V.setup;
_sfc_main$V.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/AppNavbar.vue");
  return _sfc_setup$V ? _sfc_setup$V(props, ctx) : void 0;
};
const _sfc_main$U = /* @__PURE__ */ defineComponent({
  __name: "AppFooter",
  __ssrInlineRender: true,
  setup(__props) {
    const publicApiEnabled = useFeature("public-api");
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Link = resolveComponent("Link");
      _push(`<footer${ssrRenderAttrs(mergeProps({ class: "mt-16 border-t border-gray-800 bg-gray-950" }, _attrs))}><div class="container mx-auto px-4 py-10"><div class="grid grid-cols-1 gap-8 sm:grid-cols-3"><div><h3 class="mb-3 text-sm font-semibold text-gray-300">Navigate</h3><ul class="space-y-2 text-sm"><li>`);
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("home"),
        class: "text-gray-500 transition hover:text-gray-200"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Home`);
          } else {
            return [
              createTextVNode("Home")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li>`);
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("anime.index"),
        class: "text-gray-500 transition hover:text-gray-200"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Browse Anime`);
          } else {
            return [
              createTextVNode("Browse Anime")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li>`);
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("seasonal"),
        class: "text-gray-500 transition hover:text-gray-200"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Seasonal`);
          } else {
            return [
              createTextVNode("Seasonal")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li>`);
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("schedule"),
        class: "text-gray-500 transition hover:text-gray-200"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Schedule`);
          } else {
            return [
              createTextVNode("Schedule")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li>`);
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("top.rated"),
        class: "text-gray-500 transition hover:text-gray-200"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Top Anime`);
          } else {
            return [
              createTextVNode("Top Anime")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li>`);
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("alternatives"),
        class: "text-gray-500 transition hover:text-gray-200"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`MAL Alternatives`);
          } else {
            return [
              createTextVNode("MAL Alternatives")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li>`);
      if (unref(publicApiEnabled)) {
        _push(`<li>`);
        _push(ssrRenderComponent(_component_Link, {
          href: _ctx.route("developers"),
          class: "text-gray-500 transition hover:text-gray-200"
        }, {
          default: withCtx((_2, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Developers`);
            } else {
              return [
                createTextVNode("Developers")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</li>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</ul></div><div><h3 class="mb-3 text-sm font-semibold text-gray-300">Legal</h3><ul class="space-y-2 text-sm"><li>`);
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("terms"),
        class: "text-gray-500 transition hover:text-gray-200"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Terms of Service`);
          } else {
            return [
              createTextVNode("Terms of Service")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li>`);
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("privacy"),
        class: "text-gray-500 transition hover:text-gray-200"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Privacy Policy`);
          } else {
            return [
              createTextVNode("Privacy Policy")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li><a href="/sitemap.xml" class="text-gray-500 transition hover:text-gray-200">Sitemap</a></li></ul></div><div><h3 class="mb-3 text-sm font-semibold text-gray-300">AniTrack</h3><p class="text-sm text-gray-500"> Track your anime, discover new shows, and share your list with friends. </p><p class="mt-2 text-xs text-gray-600"> Anime data provided by <a href="https://anilist.co" target="_blank" rel="noopener noreferrer" class="text-gray-500 transition hover:text-gray-200">AniList</a>. </p></div></div><div class="mt-8 border-t border-gray-800/50 pt-6 text-center text-xs text-gray-600"> © ${ssrInterpolate((/* @__PURE__ */ new Date()).getFullYear())} AniTrack </div></div></footer>`);
    };
  }
});
const _sfc_setup$U = _sfc_main$U.setup;
_sfc_main$U.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/AppFooter.vue");
  return _sfc_setup$U ? _sfc_setup$U(props, ctx) : void 0;
};
function useFlashToast() {
  const page = usePage();
  const toast = useToast();
  const stop = watch(
    () => page.props.flash?.message,
    (message) => {
      if (!message) return;
      const status = page.props.flash?.status ?? "info";
      const severityMap = {
        success: "success",
        error: "error",
        warning: "warn",
        info: "info"
      };
      toast.add({
        severity: severityMap[status] ?? "info",
        summary: status.charAt(0).toUpperCase() + status.slice(1),
        detail: message,
        life: 3e3
      });
    }
  );
  onUnmounted(stop);
}
const _sfc_main$T = /* @__PURE__ */ defineComponent({
  __name: "AppLayout",
  __ssrInlineRender: true,
  setup(__props) {
    const page = usePage();
    const user = computed(() => page.props.auth.user);
    const isAuthenticated = computed(() => !!user.value);
    useFlashToast();
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-gray-950 text-gray-100 dark" }, _attrs))}>`);
      _push(ssrRenderComponent(_sfc_main$V, {
        user: user.value,
        "is-authenticated": isAuthenticated.value
      }, null, _parent));
      _push(`<main class="container mx-auto px-4 py-6">`);
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</main>`);
      _push(ssrRenderComponent(_sfc_main$U, null, null, _parent));
      _push(ssrRenderComponent(unref(Toast), { position: "top-right" }, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup$T = _sfc_main$T.setup;
_sfc_main$T.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Layouts/AppLayout.vue");
  return _sfc_setup$T ? _sfc_setup$T(props, ctx) : void 0;
};
const _sfc_main$S = /* @__PURE__ */ defineComponent({
  __name: "AdminNav",
  __ssrInlineRender: true,
  setup(__props) {
    const page = usePage();
    const currentUrl = computed(() => page.url);
    const links = [
      { label: "Dashboard", route: "admin.dashboard" },
      { label: "Users", route: "admin.users" },
      { label: "Roles", route: "admin.roles" },
      { label: "Anime", route: "admin.anime.index" },
      { label: "Jobs", route: "admin.jobs" },
      { label: "Feature Flags", route: "admin.features" }
    ];
    function isActive(routeName) {
      return currentUrl.value.startsWith(route(routeName));
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Link = resolveComponent("Link");
      _push(`<nav${ssrRenderAttrs(mergeProps({ class: "flex items-center gap-1 mb-6 border-b border-gray-800 pb-3" }, _attrs))}><!--[-->`);
      ssrRenderList(links, (link) => {
        _push(ssrRenderComponent(_component_Link, {
          key: link.route,
          href: _ctx.route(link.route),
          class: ["rounded-lg px-3 py-1.5 text-sm transition", isActive(link.route) ? "bg-gray-800 text-gray-100 font-medium" : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"]
        }, {
          default: withCtx((_2, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(link.label)}`);
            } else {
              return [
                createTextVNode(toDisplayString(link.label), 1)
              ];
            }
          }),
          _: 2
        }, _parent));
      });
      _push(`<!--]--></nav>`);
    };
  }
});
const _sfc_setup$S = _sfc_main$S.setup;
_sfc_main$S.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/AdminNav.vue");
  return _sfc_setup$S ? _sfc_setup$S(props, ctx) : void 0;
};
const _sfc_main$R = /* @__PURE__ */ defineComponent({
  ...{ layout: _sfc_main$T },
  __name: "AnimeEditPage",
  __ssrInlineRender: true,
  props: {
    anime: {}
  },
  setup(__props) {
    const props = __props;
    const form = useForm({
      synopsis: props.anime.synopsis ?? ""
    });
    const confirmingReset = ref(false);
    const page = usePage();
    const flashMessage = computed(() => page.props.flash?.message ?? null);
    function formatDateTime(iso) {
      if (!iso) return null;
      return new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    }
    const characterCount = computed(() => form.synopsis.length);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Head = resolveComponent("Head");
      const _component_Link = resolveComponent("Link");
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_Head, {
        title: `Edit: ${__props.anime.title_english ?? __props.anime.title_romaji}`
      }, null, _parent));
      _push(`<div class="mx-auto max-w-4xl space-y-6">`);
      _push(ssrRenderComponent(_sfc_main$S, null, null, _parent));
      _push(`<div class="flex items-start justify-between gap-4"><div class="min-w-0">`);
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("admin.anime.index"),
        class: "text-sm text-gray-400 transition hover:text-gray-200"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` ← All anime `);
          } else {
            return [
              createTextVNode(" ← All anime ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<h1 class="mt-2 truncate text-2xl font-bold">${ssrInterpolate(__props.anime.title_english ?? __props.anime.title_romaji)}</h1>`);
      if (__props.anime.title_english && __props.anime.title_romaji !== __props.anime.title_english) {
        _push(`<p class="text-sm text-gray-500">${ssrInterpolate(__props.anime.title_romaji)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<p class="mt-1 text-xs uppercase tracking-wide text-gray-600">${ssrInterpolate([__props.anime.format, __props.anime.season, __props.anime.season_year].filter(Boolean).join(" · "))}</p></div>`);
      if (__props.anime.cover_image_medium) {
        _push(`<img${ssrRenderAttr("src", __props.anime.cover_image_medium)}${ssrRenderAttr("alt", __props.anime.title_romaji)} class="h-32 w-24 flex-shrink-0 rounded object-cover">`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (flashMessage.value) {
        _push(`<div class="rounded-lg border border-green-700/50 bg-green-900/20 px-4 py-2 text-sm text-green-400">${ssrInterpolate(flashMessage.value)}</div>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.anime.synopsis_rewritten_at) {
        _push(`<div class="rounded-lg border border-primary-600/40 bg-primary-900/10 px-4 py-3 text-sm"><div class="flex items-center justify-between gap-4"><span class="text-primary-300"> This description was rewritten on ${ssrInterpolate(formatDateTime(__props.anime.synopsis_rewritten_at))}. AniList syncs will not overwrite it. </span>`);
        if (confirmingReset.value) {
          _push(`<div class="flex items-center gap-2"><button class="rounded bg-red-600 px-2.5 py-1 text-xs text-white transition hover:bg-red-700"> Confirm revert </button><button class="rounded px-2.5 py-1 text-xs text-gray-400 transition hover:text-gray-200"> Cancel </button></div>`);
        } else {
          _push(`<button class="flex-shrink-0 rounded bg-gray-800 px-2.5 py-1 text-xs text-gray-300 transition hover:bg-gray-700"> Revert to AniList </button>`);
        }
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<form class="space-y-4"><div><label class="mb-1 flex items-center justify-between text-sm font-medium text-gray-300"><span>Synopsis</span><span class="text-xs font-normal text-gray-500">${ssrInterpolate(characterCount.value.toLocaleString())} chars</span></label><textarea rows="16" class="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 font-mono text-sm text-gray-200 placeholder-gray-500 outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500" placeholder="Write a unique, SEO-friendly description...">${ssrInterpolate(unref(form).synopsis)}</textarea>`);
      if (unref(form).errors.synopsis) {
        _push(`<p class="mt-1 text-sm text-red-400">${ssrInterpolate(unref(form).errors.synopsis)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<p class="mt-1 text-xs text-gray-500"> HTML tags like &lt;br&gt;, &lt;p&gt;, &lt;i&gt;, &lt;b&gt;, &lt;em&gt;, &lt;strong&gt; will render on the public page. </p></div><div class="flex items-center justify-end gap-2">`);
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("admin.anime.index"),
        class: "rounded-lg px-4 py-2 text-sm text-gray-400 transition hover:text-gray-200"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Cancel `);
          } else {
            return [
              createTextVNode(" Cancel ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<a${ssrRenderAttr("href", _ctx.route("anime.show", { anime: __props.anime.slug }))} target="_blank" rel="noopener" class="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 transition hover:bg-gray-800"> View public page </a><button type="submit"${ssrIncludeBooleanAttr(unref(form).processing) ? " disabled" : ""} class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:opacity-50">${ssrInterpolate(unref(form).processing ? "Saving…" : "Save description")}</button></div></form></div><!--]-->`);
    };
  }
});
const _sfc_setup$R = _sfc_main$R.setup;
_sfc_main$R.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/AnimeEditPage.vue");
  return _sfc_setup$R ? _sfc_setup$R(props, ctx) : void 0;
};
const __vite_glob_0_0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main$R
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main$Q = /* @__PURE__ */ defineComponent({
  __name: "PaginationBar",
  __ssrInlineRender: true,
  props: {
    currentPage: {},
    lastPage: {},
    total: {}
  },
  setup(__props) {
    const props = __props;
    function visiblePages() {
      const pages = [];
      const start = Math.max(1, props.currentPage - 2);
      const end = Math.min(props.lastPage, props.currentPage + 2);
      for (let i2 = start; i2 <= end; i2++) {
        pages.push(i2);
      }
      return pages;
    }
    return (_ctx, _push, _parent, _attrs) => {
      if (__props.lastPage > 1) {
        _push(`<nav${ssrRenderAttrs(mergeProps({ class: "flex items-center justify-center gap-1" }, _attrs))}><button class="rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"${ssrIncludeBooleanAttr(__props.currentPage === 1) ? " disabled" : ""}> Prev </button>`);
        if (visiblePages()[0] > 1) {
          _push(`<button class="rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-gray-800"> 1 </button>`);
        } else {
          _push(`<!---->`);
        }
        if (visiblePages()[0] > 2) {
          _push(`<span class="px-1 text-gray-600">…</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--[-->`);
        ssrRenderList(visiblePages(), (page) => {
          _push(`<button class="${ssrRenderClass([page === __props.currentPage ? "bg-primary-600 text-white" : "text-gray-400 hover:bg-gray-800", "rounded-lg px-3 py-2 text-sm transition"])}">${ssrInterpolate(page)}</button>`);
        });
        _push(`<!--]-->`);
        if (visiblePages()[visiblePages().length - 1] < __props.lastPage - 1) {
          _push(`<span class="px-1 text-gray-600">…</span>`);
        } else {
          _push(`<!---->`);
        }
        if (visiblePages()[visiblePages().length - 1] < __props.lastPage) {
          _push(`<button class="rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-gray-800">${ssrInterpolate(__props.lastPage)}</button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<button class="rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"${ssrIncludeBooleanAttr(__props.currentPage === __props.lastPage) ? " disabled" : ""}> Next </button></nav>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$Q = _sfc_main$Q.setup;
_sfc_main$Q.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/PaginationBar.vue");
  return _sfc_setup$Q ? _sfc_setup$Q(props, ctx) : void 0;
};
const _sfc_main$P = /* @__PURE__ */ defineComponent({
  ...{ layout: _sfc_main$T },
  __name: "AnimeListPage",
  __ssrInlineRender: true,
  props: {
    anime: {},
    filters: {}
  },
  setup(__props) {
    const props = __props;
    const search = ref(props.filters.search ?? "");
    const rewrittenOnly = ref(props.filters.rewritten_only);
    let debounceTimer = null;
    function pushFilters() {
      router.get(
        route("admin.anime.index"),
        {
          search: search.value || void 0,
          rewritten_only: rewrittenOnly.value ? 1 : void 0
        },
        { preserveState: true, preserveScroll: true }
      );
    }
    watch(search, () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(pushFilters, 300);
    });
    watch(rewrittenOnly, () => pushFilters());
    function formatDate(iso) {
      if (!iso) return null;
      return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Head = resolveComponent("Head");
      const _component_Link = resolveComponent("Link");
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_Head, { title: "Anime Descriptions" }, null, _parent));
      _push(`<div class="mx-auto max-w-6xl space-y-6">`);
      _push(ssrRenderComponent(_sfc_main$S, null, null, _parent));
      _push(`<div class="flex items-center justify-between"><div><h1 class="text-2xl font-bold">Anime Descriptions</h1><p class="mt-1 text-sm text-gray-400"> Rewrite synopses for SEO. Rewritten descriptions are preserved across AniList syncs. </p></div><span class="text-xs text-gray-500">${ssrInterpolate(__props.anime.meta.total.toLocaleString())} total</span></div><div class="flex flex-col gap-3 sm:flex-row sm:items-center"><input${ssrRenderAttr("value", search.value)} type="text" placeholder="Search by title or slug..." class="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-gray-200 placeholder-gray-500 outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500"><label class="inline-flex items-center gap-2 text-sm text-gray-300"><input${ssrIncludeBooleanAttr(Array.isArray(rewrittenOnly.value) ? ssrLooseContain(rewrittenOnly.value, null) : rewrittenOnly.value) ? " checked" : ""} type="checkbox" class="h-4 w-4 rounded border-gray-600 bg-gray-800 text-primary-600 focus:ring-primary-500"> Rewritten only </label></div><div class="overflow-hidden rounded-xl border border-gray-800"><table class="w-full"><thead class="border-b border-gray-800 bg-gray-900"><tr><th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Anime</th><th class="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 md:table-cell">Synopsis</th><th class="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 lg:table-cell">Rewritten</th><th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">Actions</th></tr></thead><tbody class="divide-y divide-gray-800"><!--[-->`);
      ssrRenderList(__props.anime.data, (item) => {
        _push(`<tr class="bg-gray-950 transition hover:bg-gray-900"><td class="px-4 py-3"><div class="flex items-center gap-3">`);
        if (item.cover_image_medium) {
          _push(`<img${ssrRenderAttr("src", item.cover_image_medium)}${ssrRenderAttr("alt", item.title)} class="h-14 w-10 flex-shrink-0 rounded object-cover">`);
        } else {
          _push(`<div class="h-14 w-10 flex-shrink-0 rounded bg-gray-800"></div>`);
        }
        _push(`<div class="min-w-0"><div class="truncate font-medium text-gray-200">${ssrInterpolate(item.title)}</div>`);
        if (item.title_secondary) {
          _push(`<div class="truncate text-xs text-gray-500">${ssrInterpolate(item.title_secondary)}</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="mt-0.5 text-[11px] uppercase tracking-wide text-gray-600">${ssrInterpolate([item.format, item.season_year].filter(Boolean).join(" · "))}</div></div></div></td><td class="hidden px-4 py-3 text-sm text-gray-400 md:table-cell">`);
        if (item.synopsis_excerpt) {
          _push(`<span>${ssrInterpolate(item.synopsis_excerpt)}</span>`);
        } else {
          _push(`<span class="italic text-gray-600">No description</span>`);
        }
        _push(`</td><td class="hidden px-4 py-3 text-xs lg:table-cell">`);
        if (item.synopsis_rewritten_at) {
          _push(`<span class="rounded bg-primary-600/20 px-2 py-0.5 text-primary-400">${ssrInterpolate(formatDate(item.synopsis_rewritten_at))}</span>`);
        } else {
          _push(`<span class="text-gray-600">—</span>`);
        }
        _push(`</td><td class="px-4 py-3 text-right">`);
        _push(ssrRenderComponent(_component_Link, {
          href: _ctx.route("admin.anime.edit", { anime: item.id }),
          class: "rounded bg-primary-600/20 px-2.5 py-1 text-xs text-primary-400 transition hover:bg-primary-600/30"
        }, {
          default: withCtx((_2, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Edit `);
            } else {
              return [
                createTextVNode(" Edit ")
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(`</td></tr>`);
      });
      _push(`<!--]-->`);
      if (__props.anime.data.length === 0) {
        _push(`<tr><td colspan="4" class="px-4 py-8 text-center text-sm text-gray-500"> No anime match your search. </td></tr>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</tbody></table></div>`);
      _push(ssrRenderComponent(_sfc_main$Q, {
        "current-page": __props.anime.meta.current_page,
        "last-page": __props.anime.meta.last_page,
        total: __props.anime.meta.total
      }, null, _parent));
      _push(`</div><!--]-->`);
    };
  }
});
const _sfc_setup$P = _sfc_main$P.setup;
_sfc_main$P.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/AnimeListPage.vue");
  return _sfc_setup$P ? _sfc_setup$P(props, ctx) : void 0;
};
const __vite_glob_0_1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main$P
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main$O = /* @__PURE__ */ defineComponent({
  ...{ layout: _sfc_main$T },
  __name: "DashboardPage",
  __ssrInlineRender: true,
  props: {
    stats: {},
    recentUsers: {},
    syncStatuses: {}
  },
  setup(__props) {
    function formatDate(iso) {
      return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    }
    function syncStatusColor(status) {
      if (status === "completed") return "text-green-400";
      if (status === "running") return "text-yellow-400";
      if (status === "failed") return "text-red-400";
      return "text-gray-500";
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Head = resolveComponent("Head");
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_Head, { title: "Admin Dashboard" }, null, _parent));
      _push(`<div class="mx-auto max-w-6xl space-y-8">`);
      _push(ssrRenderComponent(_sfc_main$S, null, null, _parent));
      _push(`<h1 class="text-2xl font-bold">Dashboard</h1><div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"><div class="rounded-xl border border-gray-800 bg-gray-900 p-4"><div class="text-2xl font-bold text-primary-400">${ssrInterpolate(__props.stats.total_users.toLocaleString())}</div><div class="mt-1 text-xs text-gray-400">Total Users</div></div><div class="rounded-xl border border-gray-800 bg-gray-900 p-4"><div class="text-2xl font-bold text-primary-400">${ssrInterpolate(__props.stats.new_users_this_month)}</div><div class="mt-1 text-xs text-gray-400">New This Month</div></div><div class="rounded-xl border border-gray-800 bg-gray-900 p-4"><div class="text-2xl font-bold text-primary-400">${ssrInterpolate(__props.stats.total_anime.toLocaleString())}</div><div class="mt-1 text-xs text-gray-400">Anime in DB</div></div><div class="rounded-xl border border-gray-800 bg-gray-900 p-4"><div class="text-2xl font-bold text-primary-400">${ssrInterpolate(__props.stats.total_list_entries.toLocaleString())}</div><div class="mt-1 text-xs text-gray-400">List Entries</div></div><div class="rounded-xl border border-gray-800 bg-gray-900 p-4"><div class="text-2xl font-bold text-primary-400">${ssrInterpolate(__props.stats.total_episodes_watched.toLocaleString())}</div><div class="mt-1 text-xs text-gray-400">Episodes Watched</div></div><div class="rounded-xl border border-gray-800 bg-gray-900 p-4"><div class="text-2xl font-bold text-primary-400">${ssrInterpolate(__props.stats.active_users_today)}</div><div class="mt-1 text-xs text-gray-400">Active Today</div></div></div><div class="grid gap-6 lg:grid-cols-2"><div class="rounded-xl border border-gray-800 bg-gray-900 p-6"><h2 class="mb-4 text-lg font-semibold">Sync Status</h2><div class="space-y-3"><div class="flex items-center justify-between"><span class="text-sm text-gray-400">Releasing Anime</span><span class="${ssrRenderClass([syncStatusColor(__props.syncStatuses.releasing), "text-sm font-medium capitalize"])}">${ssrInterpolate(__props.syncStatuses.releasing)}</span></div><div class="flex items-center justify-between"><span class="text-sm text-gray-400">Incremental Sync</span><span class="${ssrRenderClass([syncStatusColor(__props.syncStatuses.incremental), "text-sm font-medium capitalize"])}">${ssrInterpolate(__props.syncStatuses.incremental)}</span></div><div class="flex items-center justify-between"><span class="text-sm text-gray-400">Airing Schedule</span><span class="${ssrRenderClass([syncStatusColor(__props.syncStatuses.schedule), "text-sm font-medium capitalize"])}">${ssrInterpolate(__props.syncStatuses.schedule)}</span></div></div></div><div class="rounded-xl border border-gray-800 bg-gray-900 p-6"><h2 class="mb-4 text-lg font-semibold">Recent Users</h2><div class="space-y-3"><!--[-->`);
      ssrRenderList(__props.recentUsers, (user) => {
        _push(`<div class="flex items-center justify-between"><div class="flex items-center gap-3"><div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-xs font-medium text-gray-300">${ssrInterpolate(user.name.charAt(0).toUpperCase())}</div><div><div class="text-sm font-medium text-gray-200">${ssrInterpolate(user.name)} `);
        if (user.is_admin) {
          _push(`<span class="ml-1 rounded bg-primary-600/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary-400"> ADMIN </span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="text-xs text-gray-500">${ssrInterpolate(user.email)}</div></div></div><div class="text-xs text-gray-500">${ssrInterpolate(formatDate(user.created_at))}</div></div>`);
      });
      _push(`<!--]--></div></div></div></div><!--]-->`);
    };
  }
});
const _sfc_setup$O = _sfc_main$O.setup;
_sfc_main$O.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/DashboardPage.vue");
  return _sfc_setup$O ? _sfc_setup$O(props, ctx) : void 0;
};
const __vite_glob_0_2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main$O
}, Symbol.toStringTag, { value: "Module" }));
function useDebounce(source, delay = 300) {
  const debounced = ref(source.value);
  let timeout;
  watch(source, (val) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      debounced.value = val;
    }, delay);
  });
  onScopeDispose(() => clearTimeout(timeout));
  return debounced;
}
const _sfc_main$N = /* @__PURE__ */ defineComponent({
  __name: "AdminUserSearch",
  __ssrInlineRender: true,
  props: {
    placeholder: { default: "Search by username or name" },
    excludeIds: { default: () => [] }
  },
  emits: ["select"],
  setup(__props, { expose: __expose, emit: __emit }) {
    const props = __props;
    const query = ref("");
    const debouncedQuery = useDebounce(query, 200);
    const results = ref([]);
    const loading = ref(false);
    const open = ref(false);
    const activeIndex = ref(-1);
    watch(debouncedQuery, async (value) => {
      const term = value.trim();
      if (term === "") {
        results.value = [];
        loading.value = false;
        return;
      }
      loading.value = true;
      try {
        const { data } = await axios.get(route("admin.users.search"), {
          params: { q: term }
        });
        results.value = data.data.filter((u2) => !props.excludeIds.includes(u2.id));
        activeIndex.value = results.value.length > 0 ? 0 : -1;
      } catch {
        results.value = [];
      } finally {
        loading.value = false;
      }
    });
    __expose({ clear: () => {
      query.value = "";
    } });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "relative" }, _attrs))}><input${ssrRenderAttr("value", query.value)} type="text"${ssrRenderAttr("placeholder", __props.placeholder)} class="w-full rounded border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-gray-300">`);
      if (open.value && query.value.trim().length > 0) {
        _push(`<div class="absolute left-0 right-0 top-full mt-1 z-20 max-h-72 overflow-y-auto rounded border border-gray-700 bg-gray-900 shadow-lg">`);
        if (loading.value) {
          _push(`<div class="px-3 py-2 text-xs text-gray-500"> Searching… </div>`);
        } else if (results.value.length === 0) {
          _push(`<div class="px-3 py-2 text-xs text-gray-500"> No users found </div>`);
        } else {
          _push(`<ul class="divide-y divide-gray-800"><!--[-->`);
          ssrRenderList(results.value, (user, i2) => {
            _push(`<li class="${ssrRenderClass([i2 === activeIndex.value ? "bg-gray-800" : "hover:bg-gray-800/60", "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition"])}">`);
            _push(ssrRenderComponent(_sfc_main$W, {
              name: user.name,
              "avatar-url": user.avatar_url,
              size: "sm"
            }, null, _parent));
            _push(`<div class="min-w-0 flex-1"><div class="text-gray-200 truncate">${ssrInterpolate(user.name)}</div><div class="text-xs text-gray-500 truncate">@${ssrInterpolate(user.username)}</div></div></li>`);
          });
          _push(`<!--]--></ul>`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$N = _sfc_main$N.setup;
_sfc_main$N.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/AdminUserSearch.vue");
  return _sfc_setup$N ? _sfc_setup$N(props, ctx) : void 0;
};
const _sfc_main$M = /* @__PURE__ */ defineComponent({
  ...{ layout: _sfc_main$T },
  __name: "FeatureFlagsPage",
  __ssrInlineRender: true,
  props: {
    features: {}
  },
  setup(__props) {
    async function addUser(feature, username) {
      await axios.post(route("admin.features.activate-user", { feature }), { username });
      router.visit(route("admin.features"), { preserveScroll: true });
    }
    const statusLabels = {
      everyone: "Everyone",
      nobody: "Nobody",
      default: "Default (Off)",
      specific: "Specific Users"
    };
    const statusColors = {
      everyone: "text-green-400",
      nobody: "text-red-400",
      default: "text-gray-500",
      specific: "text-yellow-400"
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Head = resolveComponent("Head");
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_Head, { title: "Feature Flags" }, null, _parent));
      _push(`<div class="mx-auto max-w-6xl">`);
      _push(ssrRenderComponent(_sfc_main$S, null, null, _parent));
      _push(`<h1 class="text-2xl font-bold mb-6">Feature Flags</h1>`);
      if (__props.features.length === 0) {
        _push(`<div class="text-center py-12 text-gray-500"> No feature flags defined. </div>`);
      } else {
        _push(`<div class="space-y-4"><!--[-->`);
        ssrRenderList(__props.features, (feature) => {
          _push(`<div class="bg-gray-900 border border-gray-800 rounded-xl p-5"><div class="flex items-center justify-between mb-3"><div><h2 class="font-semibold text-gray-100 font-mono">${ssrInterpolate(feature.name)}</h2><span class="${ssrRenderClass([statusColors[feature.status], "text-xs"])}">${ssrInterpolate(statusLabels[feature.status])}</span></div><div class="flex gap-1"><button class="${ssrRenderClass([feature.status === "everyone" ? "border-green-500 bg-green-600/20 text-green-400" : "border-gray-700 text-gray-400 hover:text-gray-200", "rounded px-3 py-1.5 text-xs transition border"])}"> Everyone </button><button class="${ssrRenderClass([feature.status === "nobody" ? "border-red-500 bg-red-600/20 text-red-400" : "border-gray-700 text-gray-400 hover:text-gray-200", "rounded px-3 py-1.5 text-xs transition border"])}"> Nobody </button><button class="${ssrRenderClass([feature.status === "default" ? "border-gray-500 bg-gray-600/20 text-gray-300" : "border-gray-700 text-gray-400 hover:text-gray-200", "rounded px-3 py-1.5 text-xs transition border"])}"> Default </button></div></div><div class="border-t border-gray-800 pt-3 space-y-3"><div><div class="text-xs text-gray-500 mb-1">Add a user override</div>`);
          _push(ssrRenderComponent(_sfc_main$N, {
            "exclude-ids": feature.users.map((u2) => u2.user_id),
            placeholder: "Search by username or name",
            onSelect: (user) => addUser(feature.name, user.username)
          }, null, _parent));
          _push(`</div><div><div class="text-xs text-gray-500 mb-2">User overrides</div>`);
          if (feature.users.length > 0) {
            _push(`<div class="flex flex-wrap gap-2"><!--[-->`);
            ssrRenderList(feature.users, (user) => {
              _push(`<div class="flex items-center gap-1.5 rounded-full bg-gray-800 pl-3 pr-1.5 py-1 text-xs"><span class="text-gray-300">${ssrInterpolate(user.username)}</span><button class="text-gray-500 hover:text-red-400 transition rounded-full p-0.5"${ssrRenderAttr("aria-label", `Remove ${user.username}`)}> × </button></div>`);
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<p class="text-xs text-gray-600">No user-specific overrides</p>`);
          }
          _push(`</div></div></div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div><!--]-->`);
    };
  }
});
const _sfc_setup$M = _sfc_main$M.setup;
_sfc_main$M.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/FeatureFlagsPage.vue");
  return _sfc_setup$M ? _sfc_setup$M(props, ctx) : void 0;
};
const __vite_glob_0_3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main$M
}, Symbol.toStringTag, { value: "Module" }));
const POLL_MS = 5e3;
const _sfc_main$L = /* @__PURE__ */ defineComponent({
  ...{ layout: _sfc_main$T },
  __name: "JobsPage",
  __ssrInlineRender: true,
  props: {
    metrics: {},
    recentFailed: {},
    recentlyAdded: {},
    recentlyUpdated: {},
    syncRuns: {}
  },
  setup(__props) {
    const props = __props;
    const page = usePage();
    const flashMessage = computed(
      () => page.props.flash?.message ?? null
    );
    const syncError = computed(
      () => page.props.errors?.sync ?? null
    );
    const enqueueForm = useForm({
      anilist_id: ""
    });
    const dispatching = ref(null);
    const retryingUuid = ref(null);
    const forgettingUuid = ref(null);
    const expandedUuid = ref(null);
    const failedDetails = ref({});
    const loadingDetailUuid = ref(null);
    const detailError = ref(null);
    const copiedUuid = ref(null);
    const flushingFailed = ref(false);
    const syncRunsInProgress = computed(
      () => props.syncRuns.some((run) => run.status === "running" || run.status === "paused")
    );
    function runTitle(run) {
      const mode = run.mode.replace(/_/g, " ");
      return run.label ? `${mode} · ${run.label}` : mode;
    }
    function unitFor(run) {
      return run.mode === "stale_refresh" ? "Batch" : "Page";
    }
    function processedLabel(run) {
      if (run.total_items <= 0) return null;
      return `${run.processed_items.toLocaleString()} of ${run.total_items.toLocaleString()} processed`;
    }
    let pollTimer = null;
    function stopPolling() {
      if (pollTimer !== null) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    }
    function startPolling() {
      if (pollTimer !== null) return;
      pollTimer = setInterval(() => {
        if (document.visibilityState !== "visible") return;
        router.reload({ only: ["metrics", "syncRuns"] });
      }, POLL_MS);
    }
    function syncPolling() {
      if (syncRunsInProgress.value) {
        startPolling();
      } else {
        stopPolling();
      }
    }
    onMounted(syncPolling);
    onBeforeUnmount(stopPolling);
    watch(syncRunsInProgress, syncPolling);
    function syncStatusColor(status) {
      if (status === "completed") return "text-green-400";
      if (status === "running") return "text-yellow-400";
      if (status === "paused") return "text-orange-400";
      if (status === "failed") return "text-red-400";
      if (status === "superseded") return "text-gray-500";
      return "text-gray-500";
    }
    function statusLabel(run) {
      if (run.stalled) return "stalled";
      return run.status;
    }
    function formatDate(iso) {
      if (!iso) return "—";
      return new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    }
    function formatTimestamp(ts) {
      if (!ts) return "—";
      return new Date(ts * 1e3).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    }
    function formatDuration(seconds) {
      if (seconds === null) return "—";
      if (seconds < 60) return `${seconds}s`;
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor(seconds % 3600 / 60);
      return `${hours}h ${minutes}m`;
    }
    function progressPercent(run) {
      if (run.last_page <= 0) return null;
      return Math.min(100, Math.round(run.current_page / run.last_page * 100));
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Head = resolveComponent("Head");
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_Head, { title: "Job Observability" }, null, _parent));
      _push(`<div class="mx-auto max-w-6xl space-y-6">`);
      _push(ssrRenderComponent(_sfc_main$S, null, null, _parent));
      _push(`<div class="flex items-center justify-between"><div><h1 class="text-2xl font-bold">Jobs &amp; Sync</h1><p class="mt-1 text-sm text-gray-400"> Queue depth, sync status, recent failures, and tools for refreshing anime data. </p></div><button type="button" class="rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs text-gray-300 transition hover:border-gray-600 hover:text-gray-100"> Refresh </button></div>`);
      if (flashMessage.value) {
        _push(`<div class="rounded-lg border border-green-700/50 bg-green-900/20 px-4 py-2 text-sm text-green-300">${ssrInterpolate(flashMessage.value)}</div>`);
      } else {
        _push(`<!---->`);
      }
      if (syncError.value) {
        _push(`<div class="rounded-lg border border-red-700/50 bg-red-900/20 px-4 py-2 text-sm text-red-300">${ssrInterpolate(syncError.value)}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"><div class="rounded-xl border border-gray-800 bg-gray-900 p-4"><div class="text-2xl font-bold text-primary-400">${ssrInterpolate(__props.metrics.queued_total.toLocaleString())}</div><div class="mt-1 text-xs text-gray-400">Queued jobs</div></div><div class="rounded-xl border border-gray-800 bg-gray-900 p-4"><div class="${ssrRenderClass([__props.metrics.failed_total > 0 ? "text-red-400" : "text-primary-400", "text-2xl font-bold"])}">${ssrInterpolate(__props.metrics.failed_total.toLocaleString())}</div><div class="mt-1 text-xs text-gray-400"> Failed total `);
      if (__props.metrics.failed_last_24h > 0) {
        _push(`<span class="ml-1 text-red-400"> (${ssrInterpolate(__props.metrics.failed_last_24h)} in 24h) </span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="rounded-xl border border-gray-800 bg-gray-900 p-4"><div class="text-2xl font-bold text-primary-400">${ssrInterpolate(formatDuration(__props.metrics.queue_wait_seconds))}</div><div class="mt-1 text-xs text-gray-400">Est. time to clear</div></div><div class="rounded-xl border border-gray-800 bg-gray-900 p-4"><div class="text-2xl font-bold text-primary-400">${ssrInterpolate(__props.metrics.never_synced.toLocaleString())}</div><div class="mt-1 text-xs text-gray-400">Never synced</div></div><div class="rounded-xl border border-gray-800 bg-gray-900 p-4"><div class="text-2xl font-bold text-primary-400">${ssrInterpolate(__props.metrics.stale_sync.toLocaleString())}</div><div class="mt-1 text-xs text-gray-400"> Stale (&gt;${ssrInterpolate(__props.metrics.stale_after_days)}d / never) </div><div class="mt-1 text-[11px] text-gray-600">${ssrInterpolate(__props.metrics.refresh_excluded.toLocaleString())} excluded as settled </div></div></div><div class="grid gap-4 lg:grid-cols-2"><div class="rounded-xl border border-gray-800 bg-gray-900 p-5"><h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Anime added</h2><div class="grid grid-cols-3 gap-3"><div><div class="text-xl font-bold text-gray-100">${ssrInterpolate(__props.metrics.anime_added.last_24h.toLocaleString())}</div><div class="text-xs text-gray-500">last 24h</div></div><div><div class="text-xl font-bold text-gray-100">${ssrInterpolate(__props.metrics.anime_added.last_7d.toLocaleString())}</div><div class="text-xs text-gray-500">last 7d</div></div><div><div class="text-xl font-bold text-gray-100">${ssrInterpolate(__props.metrics.anime_added.last_30d.toLocaleString())}</div><div class="text-xs text-gray-500">last 30d</div></div></div><div class="mt-3 text-xs text-gray-500">${ssrInterpolate(__props.metrics.anime_total.toLocaleString())} total in DB </div></div><div class="rounded-xl border border-gray-800 bg-gray-900 p-5"><h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Anime updated</h2><div class="grid grid-cols-3 gap-3"><div><div class="text-xl font-bold text-gray-100">${ssrInterpolate(__props.metrics.anime_updated.last_24h.toLocaleString())}</div><div class="text-xs text-gray-500">last 24h</div></div><div><div class="text-xl font-bold text-gray-100">${ssrInterpolate(__props.metrics.anime_updated.last_7d.toLocaleString())}</div><div class="text-xs text-gray-500">last 7d</div></div><div><div class="text-xl font-bold text-gray-100">${ssrInterpolate(__props.metrics.anime_updated.last_30d.toLocaleString())}</div><div class="text-xs text-gray-500">last 30d</div></div></div><div class="mt-3 text-xs text-gray-500">Tracked via <code class="text-gray-400">synced_at</code></div></div></div><div class="grid gap-4 lg:grid-cols-2"><div class="rounded-xl border border-gray-800 bg-gray-900 p-5"><h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Queued by queue</h2><div class="space-y-2"><!--[-->`);
      ssrRenderList(__props.metrics.queued_by_queue, (row) => {
        _push(`<div class="flex items-center justify-between border-b border-gray-800/60 pb-1.5 text-sm last:border-b-0"><span class="font-mono text-gray-300">${ssrInterpolate(row.queue)}</span><span class="${ssrRenderClass(row.count > 0 ? "text-primary-300" : "text-gray-600")}">${ssrInterpolate(row.count.toLocaleString())}</span></div>`);
      });
      _push(`<!--]--></div></div><div class="rounded-xl border border-gray-800 bg-gray-900 p-5"><h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Failed by queue</h2><div class="space-y-2"><!--[-->`);
      ssrRenderList(__props.metrics.failed_by_queue, (row) => {
        _push(`<div class="flex items-center justify-between border-b border-gray-800/60 pb-1.5 text-sm last:border-b-0"><span class="font-mono text-gray-300">${ssrInterpolate(row.queue)}</span><span class="${ssrRenderClass(row.count > 0 ? "text-red-400" : "text-gray-600")}">${ssrInterpolate(row.count.toLocaleString())}</span></div>`);
      });
      _push(`<!--]--></div></div></div><div class="rounded-xl border border-gray-800 bg-gray-900 p-5"><h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400"> Sync runs <span class="ml-2 text-xs font-normal normal-case text-gray-600"> latest run per mode </span>`);
      if (syncRunsInProgress.value) {
        _push(`<span class="ml-2 text-xs font-normal normal-case text-yellow-400"> · live, refreshing every ${ssrInterpolate(POLL_MS / 1e3)}s </span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</h2>`);
      if (__props.syncRuns.length === 0) {
        _push(`<div class="py-6 text-center text-sm text-gray-500"> No sync has run yet. </div>`);
      } else {
        _push(`<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><!--[-->`);
        ssrRenderList(__props.syncRuns, (run) => {
          _push(`<div class="rounded-lg border border-gray-800 bg-gray-950 p-3"><div class="flex items-start justify-between gap-2"><span class="text-sm font-medium capitalize text-gray-200">${ssrInterpolate(runTitle(run))}</span><span class="${ssrRenderClass([run.stalled ? "text-orange-400" : syncStatusColor(run.status), "shrink-0 text-xs font-medium capitalize"])}">${ssrInterpolate(statusLabel(run))}</span></div><div class="mt-2 text-xs text-gray-500">${ssrInterpolate(unitFor(run))} ${ssrInterpolate(run.current_page)}/${ssrInterpolate(run.last_page || "?")} `);
          if (processedLabel(run)) {
            _push(`<span> · ${ssrInterpolate(processedLabel(run))}</span>`);
          } else if (run.processed_items) {
            _push(`<span> · ${ssrInterpolate(run.processed_items.toLocaleString())} items </span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
          if (progressPercent(run) !== null) {
            _push(`<div class="mt-1 h-1.5 w-full overflow-hidden rounded bg-gray-800"><div class="h-full bg-primary-500 transition-all" style="${ssrRenderStyle({ width: `${progressPercent(run)}%` })}"></div></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="mt-2 space-y-0.5 text-[11px] text-gray-600"><div>Started ${ssrInterpolate(formatDate(run.started_at))}</div>`);
          if (run.finished_at) {
            _push(`<div> Finished ${ssrInterpolate(formatDate(run.finished_at))} · took ${ssrInterpolate(formatDuration(run.duration_seconds))}</div>`);
          } else {
            _push(`<div>Running for ${ssrInterpolate(formatDuration(run.duration_seconds))}</div>`);
          }
          if (run.cutoff_at) {
            _push(`<div> Updated-since cutoff ${ssrInterpolate(formatTimestamp(run.cutoff_at))}</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
          if (run.last_error) {
            _push(`<div class="${ssrRenderClass([
              run.status === "completed" ? "bg-amber-950/40 text-amber-300" : "bg-red-950/40 text-red-300",
              "mt-2 break-words rounded px-2 py-1 text-[11px]"
            ])}">${ssrInterpolate(run.last_error)}</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div><div class="grid gap-4 lg:grid-cols-2"><div class="rounded-xl border border-gray-800 bg-gray-900 p-5"><h2 class="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-400">Queue an anime refresh</h2><p class="mb-3 text-xs text-gray-500"> Dispatches a job that fetches the AniList record and re-persists it. Useful for fixing stale entries. </p><form class="flex flex-col gap-2 sm:flex-row"><input${ssrRenderAttr("value", unref(enqueueForm).anilist_id)} type="number" min="1" placeholder="AniList ID (e.g. 21)" class="flex-1 rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500"><button type="submit"${ssrIncludeBooleanAttr(unref(enqueueForm).processing || !unref(enqueueForm).anilist_id) ? " disabled" : ""} class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50">${ssrInterpolate(unref(enqueueForm).processing ? "Queueing…" : "Queue refresh")}</button></form>`);
      if (unref(enqueueForm).errors.anilist_id) {
        _push(`<div class="mt-2 text-xs text-red-400">${ssrInterpolate(unref(enqueueForm).errors.anilist_id)}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="rounded-xl border border-gray-800 bg-gray-900 p-5"><h2 class="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-400">Trigger incremental sync</h2><p class="mb-3 text-xs text-gray-500"> Fetches anime updated on AniList since the last completed incremental run. Falls back to the last 24h if there is no prior run. </p><button type="button"${ssrIncludeBooleanAttr(dispatching.value === "incremental") ? " disabled" : ""} class="rounded-lg border border-gray-700 bg-gray-950 px-4 py-2 text-sm text-gray-200 transition hover:border-primary-500 hover:text-primary-400 disabled:cursor-not-allowed disabled:opacity-50">${ssrInterpolate(dispatching.value === "incremental" ? "Dispatching…" : "Dispatch incremental sync")}</button></div></div><div class="rounded-xl border border-gray-800 bg-gray-900 p-5"><h2 class="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-400">Stale data backlog</h2><p class="mb-4 text-xs text-gray-500"> Walks anime whose local copy is older than ${ssrInterpolate(__props.metrics.stale_after_days)} days, a batch per AniList request. Long-finished shows and entries that no longer exist upstream are flagged as settled once refreshed, so the backlog shrinks instead of cycling — the monthly FINISHED incremental sync still picks up genuine upstream edits. </p><div class="grid gap-4 sm:grid-cols-3"><div class="rounded-lg border border-gray-800 bg-gray-950 p-3"><div class="text-xl font-bold text-gray-100">${ssrInterpolate(__props.metrics.stale_sync.toLocaleString())}</div><div class="text-xs text-gray-500">awaiting refresh</div></div><div class="rounded-lg border border-gray-800 bg-gray-950 p-3"><div class="text-xl font-bold text-gray-100">${ssrInterpolate(__props.metrics.refresh_excluded.toLocaleString())}</div><div class="text-xs text-gray-500">excluded as settled</div></div><div class="rounded-lg border border-gray-800 bg-gray-950 p-3"><!--[-->`);
      ssrRenderList(__props.metrics.refresh_excluded_by_reason, (row) => {
        _push(`<div class="flex items-center justify-between text-xs"><span class="font-mono text-gray-400">${ssrInterpolate(row.reason)}</span><span class="text-gray-300">${ssrInterpolate(row.count.toLocaleString())}</span></div>`);
      });
      _push(`<!--]-->`);
      if (__props.metrics.refresh_excluded_by_reason.length === 0) {
        _push(`<div class="text-xs text-gray-600"> Nothing excluded yet </div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="mt-4 flex flex-wrap gap-2"><button type="button"${ssrIncludeBooleanAttr(dispatching.value !== null || __props.metrics.stale_sync === 0) ? " disabled" : ""} class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50">${ssrInterpolate(dispatching.value === "stale-batch" ? "Dispatching…" : `Run one batch (${__props.metrics.refresh_batch_size})`)}</button><button type="button"${ssrIncludeBooleanAttr(dispatching.value !== null || __props.metrics.stale_sync === 0) ? " disabled" : ""} class="rounded-lg border border-gray-700 bg-gray-950 px-4 py-2 text-sm text-gray-300 transition hover:border-primary-500 hover:text-primary-400 disabled:cursor-not-allowed disabled:opacity-50">${ssrInterpolate(dispatching.value === "stale" ? "Dispatching…" : `Run full sweep (up to ${__props.metrics.refresh_max_batches * __props.metrics.refresh_batch_size})`)}</button><button type="button"${ssrIncludeBooleanAttr(dispatching.value !== null || __props.metrics.refresh_excluded === 0) ? " disabled" : ""} class="rounded-lg border border-gray-700 bg-gray-950 px-4 py-2 text-sm text-gray-300 transition hover:border-gray-600 hover:text-gray-100 disabled:cursor-not-allowed disabled:opacity-50">${ssrInterpolate(dispatching.value === "exclusions" ? "Clearing…" : "Clear exclusions")}</button></div><p class="mt-2 text-[11px] text-gray-600"> One batch is a single AniList request covering ${ssrInterpolate(__props.metrics.refresh_batch_size)} anime. Each run picks up where the last left off, so you can step through the backlog a batch at a time — the counter above drops as they are refreshed or flagged. </p>`);
      if (syncRunsInProgress.value) {
        _push(`<p class="mt-2 text-[11px] text-gray-600"> A sync is already in progress; a refresh sweep will queue behind it on the sync worker. </p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="rounded-xl border border-gray-800 bg-gray-900 p-5"><div class="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 class="text-sm font-semibold uppercase tracking-wide text-gray-400"> Recent failures <span class="ml-2 text-xs font-normal normal-case text-gray-600">${ssrInterpolate(__props.recentFailed.length)} of ${ssrInterpolate(__props.metrics.failed_total.toLocaleString())} shown </span></h2>`);
      if (__props.metrics.failed_total > 0) {
        _push(`<button type="button"${ssrIncludeBooleanAttr(flushingFailed.value) ? " disabled" : ""} class="rounded-lg border border-red-800/60 bg-red-950/30 px-3 py-1.5 text-xs text-red-300 transition hover:border-red-700 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50">${ssrInterpolate(flushingFailed.value ? "Clearing…" : `Clear all (${__props.metrics.failed_total.toLocaleString()})`)}</button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (__props.recentFailed.length === 0) {
        _push(`<div class="py-6 text-center text-sm text-gray-500"> No recent failures. </div>`);
      } else {
        _push(`<div class="space-y-2"><!--[-->`);
        ssrRenderList(__props.recentFailed, (job) => {
          _push(`<div class="rounded-lg border border-gray-800 bg-gray-950 p-3 text-sm"><div class="flex flex-wrap items-start justify-between gap-2"><button type="button" class="min-w-0 flex-1 cursor-pointer text-left"${ssrRenderAttr("aria-expanded", expandedUuid.value === job.uuid)}${ssrRenderAttr("title", expandedUuid.value === job.uuid ? "Hide the full stack trace" : "Show the full stack trace")}><div class="flex items-center gap-2"><span class="${ssrRenderClass([expandedUuid.value === job.uuid ? "rotate-90" : "", "inline-block text-gray-500 transition-transform"])}" aria-hidden="true">›</span><span class="font-mono text-xs text-gray-400">${ssrInterpolate(job.queue)}</span><span class="text-gray-200">${ssrInterpolate(job.job_class ?? "unknown")}</span></div><div class="mt-1 break-words text-xs text-red-300">${ssrInterpolate(job.exception_summary)}</div><div class="mt-1 text-[11px] text-gray-500">${ssrInterpolate(formatDate(job.failed_at))} · <span class="font-mono">${ssrInterpolate(job.uuid)}</span></div></button><div class="flex shrink-0 gap-2"><button type="button" class="rounded bg-primary-600/20 px-2.5 py-1 text-xs text-primary-300 transition hover:bg-primary-600/30 disabled:opacity-50"${ssrIncludeBooleanAttr(retryingUuid.value === job.uuid) ? " disabled" : ""}>${ssrInterpolate(retryingUuid.value === job.uuid ? "Retrying…" : "Retry")}</button><button type="button" class="rounded bg-gray-800 px-2.5 py-1 text-xs text-gray-300 transition hover:bg-gray-700 disabled:opacity-50"${ssrIncludeBooleanAttr(forgettingUuid.value === job.uuid) ? " disabled" : ""}>${ssrInterpolate(forgettingUuid.value === job.uuid ? "Removing…" : "Forget")}</button></div></div>`);
          if (expandedUuid.value === job.uuid) {
            _push(`<div class="mt-3 border-t border-gray-800 pt-3">`);
            if (loadingDetailUuid.value === job.uuid) {
              _push(`<div class="text-xs text-gray-500"> Loading stack trace… </div>`);
            } else if (detailError.value) {
              _push(`<div class="text-xs text-red-400">${ssrInterpolate(detailError.value)}</div>`);
            } else if (failedDetails.value[job.uuid]) {
              _push(`<div><div class="mb-2 flex flex-wrap items-center justify-between gap-2"><div class="text-[11px] text-gray-500"> connection <span class="font-mono text-gray-400">${ssrInterpolate(failedDetails.value[job.uuid].connection)}</span>`);
              if (failedDetails.value[job.uuid].attempts !== null) {
                _push(`<!--[--> · attempts <span class="font-mono text-gray-400">${ssrInterpolate(failedDetails.value[job.uuid].attempts)}</span><!--]-->`);
              } else {
                _push(`<!---->`);
              }
              _push(`</div><button type="button" class="rounded bg-gray-800 px-2.5 py-1 text-xs text-gray-300 transition hover:bg-gray-700">${ssrInterpolate(copiedUuid.value === job.uuid ? "Copied" : "Copy trace")}</button></div><pre class="max-h-96 overflow-auto rounded-lg bg-black/60 p-3 text-[11px] leading-relaxed text-gray-300">${ssrInterpolate(failedDetails.value[job.uuid].exception)}</pre><details class="mt-2"><summary class="cursor-pointer text-[11px] text-gray-500 hover:text-gray-400"> Job payload </summary><pre class="mt-2 max-h-64 overflow-auto rounded-lg bg-black/60 p-3 text-[11px] leading-relaxed text-gray-400">${ssrInterpolate(failedDetails.value[job.uuid].payload)}</pre></details></div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div><div class="grid gap-4 lg:grid-cols-2"><div class="rounded-xl border border-gray-800 bg-gray-900 p-5"><h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Recently added anime</h2>`);
      if (__props.recentlyAdded.length === 0) {
        _push(`<div class="py-4 text-center text-sm text-gray-500"> Nothing new yet. </div>`);
      } else {
        _push(`<ul class="space-y-2"><!--[-->`);
        ssrRenderList(__props.recentlyAdded, (anime) => {
          _push(`<li class="flex items-center justify-between gap-3 text-sm"><div class="flex min-w-0 items-center gap-2">`);
          if (anime.cover_image_medium) {
            _push(`<img${ssrRenderAttr("src", anime.cover_image_medium)}${ssrRenderAttr("alt", anime.title)} class="h-9 w-7 flex-shrink-0 rounded object-cover">`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="min-w-0"><div class="truncate text-gray-200">${ssrInterpolate(anime.title)}</div><div class="text-[11px] text-gray-500">AniList #${ssrInterpolate(anime.anilist_id)}</div></div></div><span class="shrink-0 text-xs text-gray-500">${ssrInterpolate(formatDate(anime.created_at))}</span></li>`);
        });
        _push(`<!--]--></ul>`);
      }
      _push(`</div><div class="rounded-xl border border-gray-800 bg-gray-900 p-5"><h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Recently synced anime</h2>`);
      if (__props.recentlyUpdated.length === 0) {
        _push(`<div class="py-4 text-center text-sm text-gray-500"> No sync activity yet. </div>`);
      } else {
        _push(`<ul class="space-y-2"><!--[-->`);
        ssrRenderList(__props.recentlyUpdated, (anime) => {
          _push(`<li class="flex items-center justify-between gap-3 text-sm"><div class="flex min-w-0 items-center gap-2">`);
          if (anime.cover_image_medium) {
            _push(`<img${ssrRenderAttr("src", anime.cover_image_medium)}${ssrRenderAttr("alt", anime.title)} class="h-9 w-7 flex-shrink-0 rounded object-cover">`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="min-w-0"><div class="truncate text-gray-200">${ssrInterpolate(anime.title)}</div><div class="text-[11px] text-gray-500">AniList #${ssrInterpolate(anime.anilist_id)}</div></div></div><span class="shrink-0 text-xs text-gray-500">${ssrInterpolate(formatDate(anime.synced_at))}</span></li>`);
        });
        _push(`<!--]--></ul>`);
      }
      _push(`</div></div></div><!--]-->`);
    };
  }
});
const _sfc_setup$L = _sfc_main$L.setup;
_sfc_main$L.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/JobsPage.vue");
  return _sfc_setup$L ? _sfc_setup$L(props, ctx) : void 0;
};
const __vite_glob_0_4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main$L
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main$K = /* @__PURE__ */ defineComponent({
  ...{ layout: _sfc_main$T },
  __name: "RolesPage",
  __ssrInlineRender: true,
  props: {
    roles: {}
  },
  setup(__props) {
    async function assignUser(roleSlug, user) {
      await axios.post(route("admin.roles.assign", { role: roleSlug }), {
        username: user.username
      });
      router.visit(route("admin.roles"), { preserveScroll: true });
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Head = resolveComponent("Head");
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_Head, { title: "Roles" }, null, _parent));
      _push(`<div class="mx-auto max-w-6xl">`);
      _push(ssrRenderComponent(_sfc_main$S, null, null, _parent));
      _push(`<h1 class="text-2xl font-bold mb-2">Roles</h1><p class="text-sm text-gray-500 mb-6"> Assign users to roles. Features are gated by role name. </p>`);
      if (__props.roles.length === 0) {
        _push(`<div class="text-center py-12 text-gray-500"> No roles defined. </div>`);
      } else {
        _push(`<div class="space-y-4"><!--[-->`);
        ssrRenderList(__props.roles, (role) => {
          _push(`<div class="bg-gray-900 border border-gray-800 rounded-xl p-5"><div class="flex items-start justify-between mb-3"><div><h2 class="font-semibold text-gray-100">${ssrInterpolate(role.name)}</h2><span class="text-xs font-mono text-gray-500">${ssrInterpolate(role.slug)}</span>`);
          if (role.description) {
            _push(`<p class="text-xs text-gray-400 mt-1">${ssrInterpolate(role.description)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div><div class="border-t border-gray-800 pt-3 space-y-3"><div><div class="text-xs text-gray-500 mb-1">Assign a user</div>`);
          _push(ssrRenderComponent(_sfc_main$N, {
            "exclude-ids": role.users.map((u2) => u2.id),
            placeholder: "Search by username or name",
            onSelect: (user) => assignUser(role.slug, user)
          }, null, _parent));
          _push(`</div><div><div class="text-xs text-gray-500 mb-2">Assigned users</div>`);
          if (role.users.length > 0) {
            _push(`<div class="flex flex-wrap gap-2"><!--[-->`);
            ssrRenderList(role.users, (user) => {
              _push(`<div class="flex items-center gap-2 rounded-full bg-gray-800 pl-1.5 pr-1.5 py-1 text-xs">`);
              _push(ssrRenderComponent(_sfc_main$W, {
                name: user.name,
                "avatar-url": user.avatar_url,
                size: "sm"
              }, null, _parent));
              _push(`<div class="leading-tight pr-1"><div class="text-gray-200">${ssrInterpolate(user.name)}</div><div class="text-[10px] text-gray-500">@${ssrInterpolate(user.username)}</div></div><button class="text-gray-500 hover:text-red-400 transition rounded-full p-0.5"${ssrRenderAttr("aria-label", `Remove ${user.username}`)}> × </button></div>`);
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<p class="text-xs text-gray-600">No users assigned</p>`);
          }
          _push(`</div></div></div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div><!--]-->`);
    };
  }
});
const _sfc_setup$K = _sfc_main$K.setup;
_sfc_main$K.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/RolesPage.vue");
  return _sfc_setup$K ? _sfc_setup$K(props, ctx) : void 0;
};
const __vite_glob_0_5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main$K
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main$J = /* @__PURE__ */ defineComponent({
  ...{ layout: _sfc_main$T },
  __name: "UsersPage",
  __ssrInlineRender: true,
  props: {
    users: {},
    filters: {}
  },
  setup(__props) {
    const props = __props;
    const search = ref(props.filters.search ?? "");
    let debounceTimer = null;
    watch(search, (value) => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        router.get(route("admin.users"), { search: value || void 0 }, {
          preserveState: true,
          preserveScroll: true
        });
      }, 300);
    });
    const confirmingDelete = ref(null);
    function formatDate(iso) {
      return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Head = resolveComponent("Head");
      const _component_Link = resolveComponent("Link");
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_Head, { title: "User Management" }, null, _parent));
      _push(`<div class="mx-auto max-w-6xl space-y-6">`);
      _push(ssrRenderComponent(_sfc_main$S, null, null, _parent));
      _push(`<div class="flex items-center justify-between"><div><h1 class="text-2xl font-bold">Users</h1><p class="mt-1 text-sm text-gray-400">${ssrInterpolate(__props.users.meta.total)} total users</p></div>`);
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("admin.dashboard"),
        class: "text-sm text-gray-400 transition hover:text-gray-200"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` ← Dashboard `);
          } else {
            return [
              createTextVNode(" ← Dashboard ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><input${ssrRenderAttr("value", search.value)} type="text" placeholder="Search by name, email, or username..." class="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-gray-200 placeholder-gray-500 outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500"><div class="overflow-x-auto rounded-xl border border-gray-800"><table class="w-full"><thead class="border-b border-gray-800 bg-gray-900"><tr><th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">User</th><th class="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 md:table-cell">Email</th><th class="hidden px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-400 sm:table-cell">Anime</th><th class="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 lg:table-cell">Joined</th><th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">Actions</th></tr></thead><tbody class="divide-y divide-gray-800"><!--[-->`);
      ssrRenderList(__props.users.data, (user) => {
        _push(`<tr class="bg-gray-950 transition hover:bg-gray-900"><td class="px-4 py-3"><div class="flex items-center gap-3">`);
        _push(ssrRenderComponent(_sfc_main$W, {
          name: user.name,
          "avatar-url": user.avatar_url,
          size: "sm"
        }, null, _parent));
        _push(`<div><div class="font-medium text-gray-200">${ssrInterpolate(user.name)} `);
        if (user.is_admin) {
          _push(`<span class="ml-1 rounded bg-primary-600/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary-400"> ADMIN </span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="text-xs text-gray-500">@${ssrInterpolate(user.username)}</div></div></div></td><td class="hidden px-4 py-3 text-sm text-gray-400 md:table-cell">${ssrInterpolate(user.email)}</td><td class="hidden px-4 py-3 text-center text-sm text-gray-400 sm:table-cell">${ssrInterpolate(user.anime_count)}</td><td class="hidden px-4 py-3 text-sm text-gray-500 lg:table-cell">${ssrInterpolate(formatDate(user.created_at))}</td><td class="px-4 py-3 text-right"><div class="flex items-center justify-end gap-2"><button class="${ssrRenderClass([user.is_admin ? "bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30" : "bg-gray-700 text-gray-300 hover:bg-gray-600", "rounded px-2.5 py-1 text-xs transition"])}">${ssrInterpolate(user.is_admin ? "Revoke Admin" : "Make Admin")}</button>`);
        if (confirmingDelete.value === user.id) {
          _push(`<!--[--><button class="rounded bg-red-600 px-2.5 py-1 text-xs text-white transition hover:bg-red-700"> Confirm </button><button class="rounded px-2.5 py-1 text-xs text-gray-400 transition hover:text-gray-200"> Cancel </button><!--]-->`);
        } else {
          _push(`<button class="rounded bg-red-600/20 px-2.5 py-1 text-xs text-red-400 transition hover:bg-red-600/30"> Delete </button>`);
        }
        _push(`</div></td></tr>`);
      });
      _push(`<!--]--></tbody></table></div>`);
      _push(ssrRenderComponent(_sfc_main$Q, {
        "current-page": __props.users.meta.current_page,
        "last-page": __props.users.meta.last_page,
        total: __props.users.meta.total
      }, null, _parent));
      _push(`</div><!--]-->`);
    };
  }
});
const _sfc_setup$J = _sfc_main$J.setup;
_sfc_main$J.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/Admin/UsersPage.vue");
  return _sfc_setup$J ? _sfc_setup$J(props, ctx) : void 0;
};
const __vite_glob_0_6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main$J
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main$I = /* @__PURE__ */ defineComponent({
  ...{ layout: _sfc_main$T },
  __name: "AlternativesPage",
  __ssrInlineRender: true,
  setup(__props) {
    const platforms = [
      {
        name: "AniTrack",
        tagline: "That’s us, the one you’re on right now.",
        description: "A modern, fast anime tracker built on top of the AniList GraphQL API with a clean, distraction-free interface. Personal watchlists, progress tracking, seasonal schedules and shareable profiles, without the clutter.",
        pros: [
          "Snappy, modern UI with a proper dark theme",
          "Seasonal calendar and weekly airing schedule baked in",
          "Import from MyAnimeList and AniList so switching is painless",
          "Free, no ads, and actively developed"
        ],
        cons: [
          "Smaller community than the veteran sites",
          "Social features are still growing"
        ],
        highlight: true
      },
      {
        name: "MyAnimeList (MAL)",
        tagline: "The granddaddy of anime tracking.",
        description: "The largest and longest-running anime database on the web, with a huge community, forums and reviews. If you’ve been in the hobby for a decade, you probably already have an account.",
        pros: [
          "Massive, near-exhaustive database",
          "Huge user base, with reviews and discussions on almost every title",
          "Industry-standard scoring most sites reference"
        ],
        cons: [
          "UI feels dated and slow in places",
          "Ad-heavy unless you pay for MAL Supporter",
          "Moderation and data updates can be slow"
        ],
        url: "https://myanimelist.net"
      },
      {
        name: "AniList",
        tagline: "The data-rich, developer-friendly pick.",
        description: "A modern tracker with a powerful GraphQL API, rich statistics and good social features. Popular with people who want graphs, activity feeds and a more contemporary UI than MAL.",
        pros: [
          "Beautiful stats and activity pages",
          "Excellent public GraphQL API (it powers us too)",
          "Active, friendly community"
        ],
        cons: [
          "Can feel overwhelming for brand-new users",
          "Mobile experience lags behind the desktop one"
        ],
        url: "https://anilist.co"
      },
      {
        name: "Kitsu",
        tagline: "Clean, social, and beginner-friendly.",
        description: "A polished tracker with a focus on discovery and social features. Nice-looking out of the box and easy to get started with, especially if you’re coming from MAL and want something prettier.",
        pros: [
          "Friendly onboarding and clean visual design",
          "Built-in discussions and social feed",
          "Good mobile apps"
        ],
        cons: [
          "Smaller catalogue than MAL or AniList",
          "Metadata occasionally lags behind new releases"
        ],
        url: "https://kitsu.app"
      },
      {
        name: "Anime-Planet",
        tagline: "The recommendation engine.",
        description: "One of the oldest anime sites, best known for its hand-curated recommendations and tag-based discovery. Great if you want to find your next show rather than just log the last one.",
        pros: [
          "Excellent recommendations and “if you liked X…” lists",
          "Detailed tag system for mood-based browsing",
          "Covers both anime and manga equally well"
        ],
        cons: [
          "UI shows its age",
          "Tracking features are less flexible than competitors"
        ],
        url: "https://www.anime-planet.com"
      },
      {
        name: "Shikimori",
        tagline: "The power-user’s playground.",
        description: "A feature-packed tracker originally from the Russian anime community, now widely used internationally. Deep filtering, clubs, reviews and a very active userbase.",
        pros: [
          "Extremely detailed filters and stats",
          "Strong club/forum culture",
          "Free and ad-light"
        ],
        cons: [
          "Interface can feel dense if you’re not used to it",
          "Some content still skews Russian-language"
        ],
        url: "https://shikimori.one"
      },
      {
        name: "AniDB",
        tagline: "The metadata obsessive’s choice.",
        description: "A non-profit, community-run database obsessed with getting the metadata exactly right. Loved by automation tools (Plex, Jellyfin, Sonarr) for its precise episode and release data.",
        pros: [
          "Unmatched accuracy of episode and release metadata",
          "Integrates with home-media tooling",
          "Run by the community, not a company"
        ],
        cons: [
          "UI is the definition of utilitarian",
          "Tracking/social features are minimal"
        ],
        url: "https://anidb.net"
      }
    ];
    const recommendations = [
      {
        title: "If you want the best balance of speed, design and features → AniTrack",
        body: "A modern UI, AniList-powered data, seasonal schedules and MAL/AniList import make it the easiest place to land today, especially if you’re tired of clunky, ad-laden alternatives."
      },
      {
        title: "If you care about community size above all → MyAnimeList",
        body: "Nothing beats MAL for sheer volume of reviews and forum activity. Just be ready for the dated UI and the ads."
      },
      {
        title: "If you love stats, graphs and a modern API → AniList",
        body: "Great data visualisation and a first-class GraphQL API. A solid daily-driver for data nerds."
      },
      {
        title: "If you want something friendly and sociable → Kitsu",
        body: "Probably the easiest tracker for a total newcomer to pick up and enjoy."
      },
      {
        title: "If you need recommendations more than tracking → Anime-Planet",
        body: "Its tag-based discovery and curated lists are still hard to beat."
      },
      {
        title: "If you’re a power user who wants every knob → Shikimori",
        body: "Deep filters, clubs and reviews for people who live inside their tracker."
      },
      {
        title: "If you automate your anime library → AniDB",
        body: "The right pick when metadata accuracy matters more than UI polish."
      }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Head = resolveComponent("Head");
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_Head, { title: "MyAnimeList Alternatives" }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<meta name="description" content="A side-by-side look at the best MyAnimeList alternatives, including AniTrack, AniList, Kitsu, Anime-Planet, Shikimori and AniDB, with honest pros, cons and recommendations."${_scopeId}><link rel="canonical"${ssrRenderAttr("href", _ctx.route("alternatives"))}${_scopeId}>`);
          } else {
            return [
              createVNode("meta", {
                name: "description",
                content: "A side-by-side look at the best MyAnimeList alternatives, including AniTrack, AniList, Kitsu, Anime-Planet, Shikimori and AniDB, with honest pros, cons and recommendations."
              }),
              createVNode("link", {
                rel: "canonical",
                href: _ctx.route("alternatives")
              }, null, 8, ["href"])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div class="mx-auto max-w-4xl space-y-10 py-4"><header class="space-y-3"><h1 class="text-3xl font-bold">MyAnimeList Alternatives</h1><p class="text-gray-400 leading-relaxed"> MyAnimeList has been the default anime tracker for well over a decade, but it’s far from the only option. Here’s an honest, up-to-date look at the main alternatives, starting, shamelessly, with us. For each one we’ve broken down what it is, what it does well, where it falls short, and at the bottom we’ve put together a short recommendation list to help you pick. </p></header><section class="space-y-6"><h2 class="text-2xl font-semibold text-gray-100">The platforms</h2><!--[-->`);
      ssrRenderList(platforms, (platform) => {
        _push(`<article class="${ssrRenderClass([
          platform.highlight ? "border-primary-500/60 bg-primary-500/5" : "border-gray-800 bg-gray-900/40",
          "rounded-lg border p-6 space-y-4"
        ])}"><div class="flex flex-wrap items-baseline justify-between gap-2"><div class="space-y-1"><h3 class="text-xl font-semibold text-gray-100">${ssrInterpolate(platform.name)} `);
        if (platform.highlight) {
          _push(`<span class="ml-2 rounded-full bg-primary-500/20 px-2 py-0.5 text-xs font-medium text-primary-300 align-middle"> Our pick </span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</h3><p class="text-sm text-gray-400">${ssrInterpolate(platform.tagline)}</p></div>`);
        if (platform.url) {
          _push(`<a${ssrRenderAttr("href", platform.url)} target="_blank" rel="noopener noreferrer" class="text-sm text-primary-400 hover:text-primary-300"> Visit site → </a>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><p class="text-gray-400 leading-relaxed">${ssrInterpolate(platform.description)}</p><div class="grid gap-4 sm:grid-cols-2"><div class="space-y-2"><h4 class="text-sm font-semibold uppercase tracking-wide text-emerald-400">The good</h4><ul class="list-disc space-y-1 pl-5 text-sm text-gray-300"><!--[-->`);
        ssrRenderList(platform.pros, (pro) => {
          _push(`<li>${ssrInterpolate(pro)}</li>`);
        });
        _push(`<!--]--></ul></div><div class="space-y-2"><h4 class="text-sm font-semibold uppercase tracking-wide text-rose-400">The bad</h4><ul class="list-disc space-y-1 pl-5 text-sm text-gray-300"><!--[-->`);
        ssrRenderList(platform.cons, (con) => {
          _push(`<li>${ssrInterpolate(con)}</li>`);
        });
        _push(`<!--]--></ul></div></div></article>`);
      });
      _push(`<!--]--></section><section class="space-y-4"><h2 class="text-2xl font-semibold text-gray-100">What we recommend</h2><p class="text-gray-400 leading-relaxed"> There’s no single right answer. It depends on what you actually want from a tracker. In rough order, here’s how we’d suggest picking: </p><ol class="list-decimal space-y-3 pl-6 text-gray-300"><!--[-->`);
      ssrRenderList(recommendations, (rec) => {
        _push(`<li><p class="font-semibold text-gray-100">${ssrInterpolate(rec.title)}</p><p class="text-gray-400 text-sm leading-relaxed">${ssrInterpolate(rec.body)}</p></li>`);
      });
      _push(`<!--]--></ol></section></div><!--]-->`);
    };
  }
});
const _sfc_setup$I = _sfc_main$I.setup;
_sfc_main$I.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/AlternativesPage.vue");
  return _sfc_setup$I ? _sfc_setup$I(props, ctx) : void 0;
};
const __vite_glob_0_7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main$I
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main$H = /* @__PURE__ */ defineComponent({
  __name: "ScoreBadge",
  __ssrInlineRender: true,
  props: {
    score: {},
    size: {}
  },
  setup(__props) {
    const props = __props;
    const sizeClass = {
      sm: "text-xs px-1.5 py-0.5",
      md: "text-sm px-2 py-1",
      lg: "text-base px-3 py-1.5"
    }[props.size ?? "md"];
    function scoreColor(score) {
      if (score >= 8) return "bg-green-600/20 text-green-400 border-green-600/30";
      if (score >= 7) return "bg-lime-600/20 text-lime-400 border-lime-600/30";
      if (score >= 6) return "bg-yellow-600/20 text-yellow-400 border-yellow-600/30";
      if (score >= 5) return "bg-orange-600/20 text-orange-400 border-orange-600/30";
      return "bg-red-600/20 text-red-400 border-red-600/30";
    }
    return (_ctx, _push, _parent, _attrs) => {
      if (__props.score != null) {
        _push(`<span${ssrRenderAttrs(mergeProps({
          class: [[scoreColor(__props.score), unref(sizeClass)], "inline-flex items-center rounded-md border font-semibold"]
        }, _attrs))}>${ssrInterpolate(__props.score.toFixed(1))}</span>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$H = _sfc_main$H.setup;
_sfc_main$H.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/ScoreBadge.vue");
  return _sfc_setup$H ? _sfc_setup$H(props, ctx) : void 0;
};
const LIST_STATUS_LABELS = {
  watching: "Watching",
  completed: "Completed",
  on_hold: "On Hold",
  dropped: "Dropped",
  plan_to_watch: "Plan to Watch"
};
function useListMutations() {
  const queryClient = useQueryClient();
  const storeMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await axios.post("/api/list", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myList"] });
    }
  });
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...patch }) => {
      const { data } = await axios.patch(`/api/list/${id}`, patch);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myList"] });
    }
  });
  const destroyMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`/api/list/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myList"] });
    }
  });
  return {
    storeMutation,
    updateMutation,
    destroyMutation
  };
}
const _sfc_main$G = /* @__PURE__ */ defineComponent({
  __name: "ListEntryModal",
  __ssrInlineRender: true,
  props: {
    anime: {},
    entry: {}
  },
  emits: ["close", "saved", "deleted"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const visible = ref(true);
    const statusOptions = Object.entries(LIST_STATUS_LABELS).map(([value, label]) => ({ value, label }));
    const status = ref(props.entry?.status ?? "plan_to_watch");
    const displayScore = ref(props.entry?.display_score ?? 0);
    const progress = ref(props.entry?.progress ?? 0);
    const startedAt = ref(props.entry?.started_at ?? "");
    const completedAt = ref(props.entry?.completed_at ?? "");
    const notes = ref(props.entry?.notes ?? "");
    const showNotes = ref(!!props.entry?.notes);
    const toast = useToast();
    const { storeMutation, updateMutation, destroyMutation } = useListMutations();
    const saving = computed(() => storeMutation.isPending.value || updateMutation.isPending.value);
    function save() {
      const score = displayScore.value > 0 ? displayScore.value : null;
      const payload = {
        status: status.value,
        score,
        progress: progress.value,
        started_at: startedAt.value || null,
        completed_at: completedAt.value || null,
        notes: notes.value || null
      };
      const onError = () => {
        toast.add({
          severity: "error",
          summary: "Error",
          detail: "Failed to save. Please try again.",
          life: 4e3
        });
      };
      if (props.entry) {
        updateMutation.mutate(
          { id: props.entry.id, ...payload },
          { onSuccess: (data) => emit("saved", data), onError }
        );
      } else {
        storeMutation.mutate(
          { anime_id: props.anime.id, ...payload },
          { onSuccess: (data) => emit("saved", data), onError }
        );
      }
    }
    function remove() {
      if (!props.entry) return;
      destroyMutation.mutate(props.entry.id, {
        onSuccess: () => emit("deleted"),
        onError: () => {
          toast.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to remove. Please try again.",
            life: 4e3
          });
        }
      });
    }
    function close() {
      visible.value = false;
      emit("close");
    }
    const displayTitle = computed(() => props.anime.title_english || props.anime.title_romaji);
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(unref(Dialog), mergeProps({
        visible: visible.value,
        modal: "",
        header: __props.entry ? "Edit Entry" : "Add to List",
        class: "w-full max-w-lg",
        "onUpdate:visible": (v2) => {
          if (!v2) close();
        }
      }, _attrs), {
        footer: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="flex items-center justify-between w-full"${_scopeId}>`);
            if (__props.entry) {
              _push2(ssrRenderComponent(unref(Button), {
                label: "Remove",
                severity: "danger",
                text: "",
                size: "small",
                onClick: remove
              }, null, _parent2, _scopeId));
            } else {
              _push2(`<span${_scopeId}></span>`);
            }
            _push2(`<div class="flex gap-2"${_scopeId}>`);
            _push2(ssrRenderComponent(unref(Button), {
              label: "Cancel",
              severity: "secondary",
              text: "",
              onClick: close
            }, null, _parent2, _scopeId));
            _push2(ssrRenderComponent(unref(Button), {
              label: "Save",
              loading: saving.value,
              onClick: save
            }, null, _parent2, _scopeId));
            _push2(`</div></div>`);
          } else {
            return [
              createVNode("div", { class: "flex items-center justify-between w-full" }, [
                __props.entry ? (openBlock(), createBlock(unref(Button), {
                  key: 0,
                  label: "Remove",
                  severity: "danger",
                  text: "",
                  size: "small",
                  onClick: remove
                })) : (openBlock(), createBlock("span", { key: 1 })),
                createVNode("div", { class: "flex gap-2" }, [
                  createVNode(unref(Button), {
                    label: "Cancel",
                    severity: "secondary",
                    text: "",
                    onClick: close
                  }),
                  createVNode(unref(Button), {
                    label: "Save",
                    loading: saving.value,
                    onClick: save
                  }, null, 8, ["loading"])
                ])
              ])
            ];
          }
        }),
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="space-y-4"${_scopeId}><p class="text-sm text-gray-400"${_scopeId}>${ssrInterpolate(displayTitle.value)}</p><div${_scopeId}><label class="block text-sm text-gray-400 mb-1"${_scopeId}>Status</label>`);
            _push2(ssrRenderComponent(unref(Select), {
              modelValue: status.value,
              "onUpdate:modelValue": ($event) => status.value = $event,
              options: unref(statusOptions),
              "option-label": "label",
              "option-value": "value",
              class: "w-full"
            }, null, _parent2, _scopeId));
            _push2(`</div><div${_scopeId}><label class="block text-sm text-gray-400 mb-1"${_scopeId}> Score: ${ssrInterpolate(displayScore.value > 0 ? displayScore.value : "-")}</label>`);
            _push2(ssrRenderComponent(unref(Slider), {
              "model-value": displayScore.value,
              min: 0,
              max: 10,
              step: 1,
              class: "w-full",
              "onUpdate:modelValue": (v2) => displayScore.value = Array.isArray(v2) ? v2[0] : v2
            }, null, _parent2, _scopeId));
            _push2(`</div><div${_scopeId}><label class="block text-sm text-gray-400 mb-1"${_scopeId}> Progress </label><div class="flex items-center gap-2"${_scopeId}><input${ssrRenderAttr("value", progress.value)} type="number" min="0" class="w-20 rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-gray-200 text-sm"${_scopeId}><span class="text-gray-500"${_scopeId}>/ ${ssrInterpolate(__props.anime.episodes ?? "?")}</span></div></div><div class="grid grid-cols-2 gap-4"${_scopeId}><div${_scopeId}><label class="block text-sm text-gray-400 mb-1"${_scopeId}>Start Date</label>`);
            _push2(ssrRenderComponent(unref(InputText), {
              modelValue: startedAt.value,
              "onUpdate:modelValue": ($event) => startedAt.value = $event,
              type: "date",
              class: "w-full"
            }, null, _parent2, _scopeId));
            _push2(`</div><div${_scopeId}><label class="block text-sm text-gray-400 mb-1"${_scopeId}>Finish Date</label>`);
            _push2(ssrRenderComponent(unref(InputText), {
              modelValue: completedAt.value,
              "onUpdate:modelValue": ($event) => completedAt.value = $event,
              type: "date",
              class: "w-full"
            }, null, _parent2, _scopeId));
            _push2(`</div></div><div${_scopeId}>`);
            if (!showNotes.value) {
              _push2(`<button class="text-sm text-gray-500 hover:text-gray-300 transition"${_scopeId}> + Add Notes </button>`);
            } else {
              _push2(`<div${_scopeId}><label class="block text-sm text-gray-400 mb-1"${_scopeId}>Notes</label>`);
              _push2(ssrRenderComponent(unref(Textarea), {
                modelValue: notes.value,
                "onUpdate:modelValue": ($event) => notes.value = $event,
                rows: "2",
                class: "w-full"
              }, null, _parent2, _scopeId));
              _push2(`</div>`);
            }
            _push2(`</div></div>`);
          } else {
            return [
              createVNode("div", { class: "space-y-4" }, [
                createVNode("p", { class: "text-sm text-gray-400" }, toDisplayString(displayTitle.value), 1),
                createVNode("div", null, [
                  createVNode("label", { class: "block text-sm text-gray-400 mb-1" }, "Status"),
                  createVNode(unref(Select), {
                    modelValue: status.value,
                    "onUpdate:modelValue": ($event) => status.value = $event,
                    options: unref(statusOptions),
                    "option-label": "label",
                    "option-value": "value",
                    class: "w-full"
                  }, null, 8, ["modelValue", "onUpdate:modelValue", "options"])
                ]),
                createVNode("div", null, [
                  createVNode("label", { class: "block text-sm text-gray-400 mb-1" }, " Score: " + toDisplayString(displayScore.value > 0 ? displayScore.value : "-"), 1),
                  createVNode(unref(Slider), {
                    "model-value": displayScore.value,
                    min: 0,
                    max: 10,
                    step: 1,
                    class: "w-full",
                    "onUpdate:modelValue": (v2) => displayScore.value = Array.isArray(v2) ? v2[0] : v2
                  }, null, 8, ["model-value", "onUpdate:modelValue"])
                ]),
                createVNode("div", null, [
                  createVNode("label", { class: "block text-sm text-gray-400 mb-1" }, " Progress "),
                  createVNode("div", { class: "flex items-center gap-2" }, [
                    withDirectives(createVNode("input", {
                      "onUpdate:modelValue": ($event) => progress.value = $event,
                      type: "number",
                      min: "0",
                      class: "w-20 rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-gray-200 text-sm"
                    }, null, 8, ["onUpdate:modelValue"]), [
                      [
                        vModelText,
                        progress.value,
                        void 0,
                        { number: true }
                      ]
                    ]),
                    createVNode("span", { class: "text-gray-500" }, "/ " + toDisplayString(__props.anime.episodes ?? "?"), 1)
                  ])
                ]),
                createVNode("div", { class: "grid grid-cols-2 gap-4" }, [
                  createVNode("div", null, [
                    createVNode("label", { class: "block text-sm text-gray-400 mb-1" }, "Start Date"),
                    createVNode(unref(InputText), {
                      modelValue: startedAt.value,
                      "onUpdate:modelValue": ($event) => startedAt.value = $event,
                      type: "date",
                      class: "w-full"
                    }, null, 8, ["modelValue", "onUpdate:modelValue"])
                  ]),
                  createVNode("div", null, [
                    createVNode("label", { class: "block text-sm text-gray-400 mb-1" }, "Finish Date"),
                    createVNode(unref(InputText), {
                      modelValue: completedAt.value,
                      "onUpdate:modelValue": ($event) => completedAt.value = $event,
                      type: "date",
                      class: "w-full"
                    }, null, 8, ["modelValue", "onUpdate:modelValue"])
                  ])
                ]),
                createVNode("div", null, [
                  !showNotes.value ? (openBlock(), createBlock("button", {
                    key: 0,
                    class: "text-sm text-gray-500 hover:text-gray-300 transition",
                    onClick: ($event) => showNotes.value = true
                  }, " + Add Notes ", 8, ["onClick"])) : (openBlock(), createBlock("div", { key: 1 }, [
                    createVNode("label", { class: "block text-sm text-gray-400 mb-1" }, "Notes"),
                    createVNode(unref(Textarea), {
                      modelValue: notes.value,
                      "onUpdate:modelValue": ($event) => notes.value = $event,
                      rows: "2",
                      class: "w-full"
                    }, null, 8, ["modelValue", "onUpdate:modelValue"])
                  ]))
                ])
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup$G = _sfc_main$G.setup;
_sfc_main$G.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/ListEntryModal.vue");
  return _sfc_setup$G ? _sfc_setup$G(props, ctx) : void 0;
};
const _sfc_main$F = /* @__PURE__ */ defineComponent({
  __name: "AddToListButton",
  __ssrInlineRender: true,
  props: {
    anime: {},
    initialEntry: {}
  },
  setup(__props) {
    const props = __props;
    const toast = useToast();
    const showModal = ref(false);
    const currentEntry = ref(props.initialEntry);
    function onSaved(entry) {
      showModal.value = false;
      const isNew = !currentEntry.value;
      currentEntry.value = entry;
      toast.add({
        severity: "success",
        summary: isNew ? "Added to List" : "List Updated",
        detail: `${props.anime.title_english || props.anime.title_romaji} — ${LIST_STATUS_LABELS[entry.status]}`,
        life: 3e3
      });
    }
    function onDeleted() {
      showModal.value = false;
      currentEntry.value = null;
      toast.add({
        severity: "info",
        summary: "Removed from List",
        detail: props.anime.title_english || props.anime.title_romaji,
        life: 3e3
      });
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(_attrs)}>`);
      if (!currentEntry.value) {
        _push(ssrRenderComponent(unref(Button), {
          label: "Add to List",
          size: "small",
          onClick: ($event) => showModal.value = true
        }, null, _parent));
      } else {
        _push(`<button class="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-gray-200 transition hover:bg-gray-700"><span>${ssrInterpolate(unref(LIST_STATUS_LABELS)[currentEntry.value.status])}</span><svg class="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>`);
      }
      if (showModal.value) {
        _push(ssrRenderComponent(_sfc_main$G, {
          anime: __props.anime,
          entry: currentEntry.value,
          onClose: ($event) => showModal.value = false,
          onSaved,
          onDeleted
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$F = _sfc_main$F.setup;
_sfc_main$F.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/AddToListButton.vue");
  return _sfc_setup$F ? _sfc_setup$F(props, ctx) : void 0;
};
let refCount = 0;
let intervalId = null;
const now = ref(Date.now());
function useCountdown() {
  onMounted(() => {
    refCount++;
    if (refCount === 1) {
      now.value = Date.now();
      intervalId = setInterval(() => {
        now.value = Date.now();
      }, 6e4);
    }
  });
  onUnmounted(() => {
    refCount--;
    if (refCount === 0 && intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  });
  function formatCountdown(airsAt) {
    const target = new Date(airsAt).getTime();
    if (Number.isNaN(target)) return "--";
    const seconds = Math.floor((target - now.value) / 1e3);
    if (seconds <= 0) return "Aired";
    const d2 = Math.floor(seconds / 86400);
    const h2 = Math.floor(seconds % 86400 / 3600);
    const m2 = Math.floor(seconds % 3600 / 60);
    if (d2 > 0) return `${d2}d ${h2}h`;
    if (h2 > 0) return `${h2}h ${m2}m`;
    return `${m2}m`;
  }
  function formatLocalTime(iso, timezone) {
    try {
      return new Date(iso).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: timezone,
        hour12: true
      });
    } catch {
      return new Date(iso).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    }
  }
  function formatLocalDate(iso, timezone) {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: timezone
      });
    } catch {
      return new Date(iso).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric"
      });
    }
  }
  return { now, formatCountdown, formatLocalTime, formatLocalDate };
}
const STATUS_DOT_CLASS = {
  watching: "bg-blue-400",
  completed: "bg-green-400",
  plan_to_watch: "bg-gray-500",
  on_hold: "bg-yellow-400",
  dropped: "bg-red-400"
};
function statusDotClass(status) {
  return STATUS_DOT_CLASS[status] ?? "bg-gray-500";
}
const _sfc_main$E = /* @__PURE__ */ defineComponent({
  ...{ layout: _sfc_main$T },
  __name: "AnimeDetailPage",
  __ssrInlineRender: true,
  props: {
    anime: {},
    list_entry: {},
    seasons: {},
    recommendations: {},
    og: {}
  },
  setup(__props) {
    const props = __props;
    const page = usePage();
    const isAuthenticated = computed(() => !!page.props.auth.user);
    const studioPagesEnabled = useFeature("studio-pages");
    const voiceActorPagesEnabled = useFeature("voice-actor-pages");
    const { formatCountdown, formatLocalDate } = useCountdown();
    function displayTitle(anime) {
      return anime.title_english || anime.title_romaji;
    }
    function formatLabel(format) {
      if (!format) return "Unknown";
      return format.replace(/_/g, " ");
    }
    function statusLabel(status) {
      if (!status) return "Unknown";
      const map = {
        FINISHED: "Finished",
        RELEASING: "Airing",
        NOT_YET_RELEASED: "Not Yet Aired",
        CANCELLED: "Cancelled",
        HIATUS: "Hiatus"
      };
      return map[status] || status;
    }
    function sourceLabel(source) {
      if (!source) return "Unknown";
      return source.replace(/_/g, " ").replace(/\b\w/g, (c2) => c2.toUpperCase());
    }
    function seasonLabel(season, year) {
      if (!season || !year) return "Unknown";
      return `${season.charAt(0) + season.slice(1).toLowerCase()} ${year}`;
    }
    function formatDate(dateStr) {
      if (!dateStr) return "?";
      return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    function relationLabel(type) {
      return type.replace(/_/g, " ").replace(/\b\w/g, (c2) => c2.toUpperCase());
    }
    const mainStudios = computed(() => props.anime.studios?.filter((s2) => s2.is_main) ?? []);
    const otherStudios = computed(() => props.anime.studios?.filter((s2) => !s2.is_main) ?? []);
    function studioRoute(studio) {
      if (!studio.slug) return null;
      const routeName = studio.is_animation_studio ? "studios.show" : "producers.show";
      return route(routeName, { studio: studio.slug });
    }
    function voiceActorRoute(va) {
      if (!va.slug) return null;
      return route("people.show", { person: va.slug });
    }
    function languageLabel(language) {
      const map = {
        JAPANESE: "JP",
        ENGLISH: "EN"
      };
      return map[language] ?? language.slice(0, 2).toUpperCase();
    }
    function sortedVoiceActors(vas) {
      const order = { JAPANESE: 0, ENGLISH: 1 };
      return [...vas].sort((a2, b2) => (order[a2.language] ?? 99) - (order[b2.language] ?? 99));
    }
    const characters = computed(() => props.anime.characters ?? []);
    const mainCharacters = computed(() => characters.value.filter((c2) => c2.role === "MAIN"));
    const supportingCharacters = computed(() => characters.value.filter((c2) => c2.role !== "MAIN"));
    const displayCharacters = computed(() => [...mainCharacters.value, ...supportingCharacters.value]);
    const schedules = computed(() => props.anime.airing_schedules ?? []);
    const relations = computed(() => (props.anime.relations ?? []).filter((r2) => r2.related_anime));
    const hasTrailer = computed(() => !!props.anime.trailer_url && !!embedUrl(props.anime.trailer_url));
    const hasSeasons = computed(() => props.seasons.length > 1);
    const episodesList = computed(() => props.anime.episodes_list ?? []);
    const episodesTabEnabled = useFeature("episodes-tab");
    const episodeFilter = ref("all");
    const EPISODE_FILTERS = ["all", "aired", "upcoming"];
    const filteredEpisodes = computed(() => {
      if (episodeFilter.value === "all") return episodesList.value;
      return episodesList.value.filter((ep) => ep.status === episodeFilter.value);
    });
    const episodeCounts = computed(() => ({
      all: episodesList.value.length,
      aired: episodesList.value.filter((ep) => ep.status === "aired").length,
      upcoming: episodesList.value.filter((ep) => ep.status === "upcoming").length
    }));
    function embedUrl(url) {
      try {
        const parsed = new URL(url);
        if (parsed.hostname.includes("youtube.com") || parsed.hostname.includes("youtu.be")) {
          const videoId = parsed.searchParams.get("v") || parsed.pathname.slice(1);
          return `https://www.youtube.com/embed/${videoId}`;
        }
        if (parsed.hostname.includes("dailymotion.com")) {
          const videoId = parsed.pathname.split("/").pop();
          return `https://www.dailymotion.com/embed/video/${videoId}`;
        }
        return null;
      } catch {
        return null;
      }
    }
    const availableTabs = computed(() => {
      const tabs = [];
      if (hasTrailer.value) tabs.push({ key: "trailer", label: "Trailer" });
      if (hasSeasons.value) tabs.push({ key: "franchise", label: "Franchise" });
      if (episodesTabEnabled.value && episodesList.value.length) tabs.push({ key: "episodes", label: "Episodes" });
      if (schedules.value.length) tabs.push({ key: "schedule", label: "Schedule" });
      if (characters.value.length) tabs.push({ key: "characters", label: "Characters" });
      return tabs;
    });
    const activeTab = ref(null);
    const currentTab = computed(() => {
      if (activeTab.value && availableTabs.value.some((t3) => t3.key === activeTab.value)) {
        return activeTab.value;
      }
      return availableTabs.value[0]?.key ?? null;
    });
    const STATUS_OPTIONS = ["watching", "completed", "on_hold", "dropped", "plan_to_watch"];
    const statusMenuOpen = ref(false);
    const statusMenuRef = ref(null);
    const editModalOpen = ref(false);
    const { updateMutation } = useListMutations();
    function reloadEntry() {
      router.reload({ only: ["list_entry"] });
    }
    const canIncrement = computed(() => {
      if (!props.list_entry) return false;
      const total = props.anime.episodes;
      return total == null || props.list_entry.progress < total;
    });
    function handleDocClick(e2) {
      if (statusMenuOpen.value && statusMenuRef.value && !statusMenuRef.value.contains(e2.target)) {
        statusMenuOpen.value = false;
      }
    }
    onMounted(() => document.addEventListener("mousedown", handleDocClick));
    onBeforeUnmount(() => document.removeEventListener("mousedown", handleDocClick));
    function displayScore() {
      if (props.anime.average_score == null) return "—";
      return props.anime.average_score.toFixed(1);
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Head = resolveComponent("Head");
      const _component_Link = resolveComponent("Link");
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_Head, {
        title: displayTitle(__props.anime)
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<meta name="description"${ssrRenderAttr("content", __props.og.description)}${_scopeId}><link rel="canonical"${ssrRenderAttr("href", __props.og.url)}${_scopeId}><meta property="og:title"${ssrRenderAttr("content", __props.og.title)}${_scopeId}><meta property="og:description"${ssrRenderAttr("content", __props.og.description)}${_scopeId}>`);
            if (__props.og.image) {
              _push2(`<meta property="og:image"${ssrRenderAttr("content", __props.og.image)}${_scopeId}>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<meta property="og:url"${ssrRenderAttr("content", __props.og.url)}${_scopeId}><meta property="og:type" content="website"${_scopeId}><meta name="twitter:card" content="summary_large_image"${_scopeId}><meta name="twitter:title"${ssrRenderAttr("content", __props.og.title)}${_scopeId}><meta name="twitter:description"${ssrRenderAttr("content", __props.og.description)}${_scopeId}>`);
            if (__props.og.image) {
              _push2(`<meta name="twitter:image"${ssrRenderAttr("content", __props.og.image)}${_scopeId}>`);
            } else {
              _push2(`<!---->`);
            }
          } else {
            return [
              createVNode("meta", {
                name: "description",
                content: __props.og.description
              }, null, 8, ["content"]),
              createVNode("link", {
                rel: "canonical",
                href: __props.og.url
              }, null, 8, ["href"]),
              createVNode("meta", {
                property: "og:title",
                content: __props.og.title
              }, null, 8, ["content"]),
              createVNode("meta", {
                property: "og:description",
                content: __props.og.description
              }, null, 8, ["content"]),
              __props.og.image ? (openBlock(), createBlock("meta", {
                key: 0,
                property: "og:image",
                content: __props.og.image
              }, null, 8, ["content"])) : createCommentVNode("", true),
              createVNode("meta", {
                property: "og:url",
                content: __props.og.url
              }, null, 8, ["content"]),
              createVNode("meta", {
                property: "og:type",
                content: "website"
              }),
              createVNode("meta", {
                name: "twitter:card",
                content: "summary_large_image"
              }),
              createVNode("meta", {
                name: "twitter:title",
                content: __props.og.title
              }, null, 8, ["content"]),
              createVNode("meta", {
                name: "twitter:description",
                content: __props.og.description
              }, null, 8, ["content"]),
              __props.og.image ? (openBlock(), createBlock("meta", {
                key: 1,
                name: "twitter:image",
                content: __props.og.image
              }, null, 8, ["content"])) : createCommentVNode("", true)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div class="-mx-4 -mt-6"><div class="relative h-64 overflow-hidden bg-gray-900 md:h-80 lg:h-[340px]">`);
      if (__props.anime.banner_image) {
        _push(`<img${ssrRenderAttr("src", __props.anime.banner_image)}${ssrRenderAttr("alt", displayTitle(__props.anime))} class="h-full w-full object-cover" loading="eager">`);
      } else {
        _push(`<div class="h-full w-full" style="${ssrRenderStyle(__props.anime.cover_image_color ? `background: radial-gradient(circle at 30% 50%, ${__props.anime.cover_image_color}33, transparent 60%), linear-gradient(135deg, ${__props.anime.cover_image_color}55, #111827);` : "background: linear-gradient(135deg, #1f2937, #030712);")}"></div>`);
      }
      _push(`<div class="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-gray-950"></div><button type="button" class="absolute left-4 top-4 flex items-center gap-1.5 rounded-lg bg-black/50 px-3 py-1.5 text-xs text-gray-100 backdrop-blur-md transition hover:bg-black/70 md:left-6 md:top-6"><svg viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5"><path fill-rule="evenodd" d="M12.707 4.293a1 1 0 010 1.414L8.414 10l4.293 4.293a1 1 0 01-1.414 1.414l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg> Back </button></div><div class="container relative mx-auto -mt-40 px-4 md:-mt-44"><div class="flex flex-col items-start gap-5 md:flex-row md:items-end md:gap-8"><div class="w-36 shrink-0 overflow-hidden rounded-xl bg-gray-800 shadow-2xl ring-1 ring-gray-800 md:w-48 lg:w-56">`);
      if (__props.anime.cover_image_large || __props.anime.cover_image_medium) {
        _push(`<img${ssrRenderAttr("src", __props.anime.cover_image_large || __props.anime.cover_image_medium)}${ssrRenderAttr("alt", displayTitle(__props.anime))} class="w-full" loading="eager">`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="min-w-0 flex-1 pb-2"><div class="mb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-gray-300 drop-shadow">${ssrInterpolate(formatLabel(__props.anime.format))} `);
      if (__props.anime.season && __props.anime.season_year) {
        _push(`<span> · ${ssrInterpolate(seasonLabel(__props.anime.season, __props.anime.season_year))}</span>`);
      } else {
        _push(`<!---->`);
      }
      if (mainStudios.value.length) {
        _push(`<span> · ${ssrInterpolate(mainStudios.value.map((s2) => s2.name).join(" × "))}</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><h1 class="text-3xl font-bold tracking-tight text-gray-100 drop-shadow-lg sm:text-4xl md:text-5xl">${ssrInterpolate(displayTitle(__props.anime))}</h1>`);
      if (__props.anime.title_english && __props.anime.title_romaji !== __props.anime.title_english) {
        _push(`<p class="mt-2 text-sm text-gray-300 drop-shadow">${ssrInterpolate(__props.anime.title_romaji)}</p>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.anime.title_native) {
        _push(`<p class="text-xs text-gray-400 drop-shadow">${ssrInterpolate(__props.anime.title_native)}</p>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.anime.genres?.length) {
        _push(`<div class="mt-4 flex flex-wrap gap-1.5"><!--[-->`);
        ssrRenderList(__props.anime.genres, (g2) => {
          _push(ssrRenderComponent(_component_Link, {
            key: g2.id,
            href: _ctx.route("anime.index", { "filter[genre]": g2.name }),
            class: "rounded-full border border-gray-700/80 bg-gray-900/60 px-3 py-1 text-xs text-gray-200 backdrop-blur-md transition hover:border-primary-400 hover:text-primary-300"
          }, {
            default: withCtx((_2, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(g2.name)}`);
              } else {
                return [
                  createTextVNode(toDisplayString(g2.name), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="mt-8 flex flex-wrap items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/70 px-4 py-3 backdrop-blur-sm md:px-5">`);
      if (isAuthenticated.value && __props.list_entry) {
        _push(`<!--[--><div class="relative"><button type="button" class="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-gray-200 transition hover:bg-gray-700"><span class="${ssrRenderClass([unref(statusDotClass)(__props.list_entry.status), "h-1.5 w-1.5 rounded-full"])}"></span> ${ssrInterpolate(unref(LIST_STATUS_LABELS)[__props.list_entry.status])} <svg viewBox="0 0 20 20" fill="currentColor" class="h-3 w-3 text-gray-400"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clip-rule="evenodd"></path></svg></button>`);
        if (statusMenuOpen.value) {
          _push(`<div class="absolute left-0 top-full z-50 mt-1 min-w-[170px] rounded-lg border border-gray-700 bg-gray-900 p-1 shadow-lg"><!--[-->`);
          ssrRenderList(STATUS_OPTIONS, (s2) => {
            _push(`<button type="button" class="${ssrRenderClass([__props.list_entry.status === s2 ? "bg-gray-800" : "", "flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-gray-200 transition hover:bg-gray-800"])}"><span class="${ssrRenderClass([unref(statusDotClass)(s2), "h-1.5 w-1.5 rounded-full"])}"></span> ${ssrInterpolate(unref(LIST_STATUS_LABELS)[s2])} `);
            if (__props.list_entry.status === s2) {
              _push(`<svg viewBox="0 0 20 20" fill="currentColor" class="ml-auto h-3 w-3 text-gray-400"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</button>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="hidden h-6 w-px bg-gray-800 sm:block"></div><div class="text-sm"><span class="font-mono font-medium text-gray-100">${ssrInterpolate(__props.list_entry.progress)} / ${ssrInterpolate(__props.anime.episodes ?? "?")}</span><span class="ml-2 text-gray-500">episodes</span></div>`);
        if (__props.list_entry.display_score != null) {
          _push(`<!--[--><div class="hidden h-6 w-px bg-gray-800 sm:block"></div><div class="text-sm"><span class="font-mono text-gray-100">★ ${ssrInterpolate(__props.list_entry.display_score)}</span><span class="ml-2 text-gray-500">your score</span></div><!--]-->`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="flex-1"></div><button type="button" class="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"${ssrIncludeBooleanAttr(!canIncrement.value || unref(updateMutation).isPending.value) ? " disabled" : ""}><svg viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"></path></svg> +1 episode </button><button type="button" class="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-gray-200 transition hover:bg-gray-700"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" class="h-3.5 w-3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M14 3l3 3-9 9H5v-3l9-9zM13 4l3 3"></path></svg> Edit </button><!--]-->`);
      } else if (isAuthenticated.value) {
        _push(`<!--[--><div class="text-sm text-gray-400">Not in your list</div><div class="flex-1"></div>`);
        _push(ssrRenderComponent(_sfc_main$F, {
          anime: __props.anime,
          "initial-entry": null
        }, null, _parent));
        _push(`<!--]-->`);
      } else {
        _push(`<div class="text-sm text-gray-400">`);
        _push(ssrRenderComponent(_component_Link, {
          href: _ctx.route("login"),
          class: "text-primary-400 transition hover:text-primary-300"
        }, {
          default: withCtx((_2, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Sign in`);
            } else {
              return [
                createTextVNode("Sign in")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(` to track this anime </div>`);
      }
      _push(`</div>`);
      if (editModalOpen.value && __props.list_entry) {
        _push(ssrRenderComponent(_sfc_main$G, {
          anime: __props.anime,
          entry: __props.list_entry,
          onClose: ($event) => editModalOpen.value = false,
          onSaved: () => {
            editModalOpen.value = false;
            reloadEntry();
          },
          onDeleted: () => {
            editModalOpen.value = false;
            reloadEntry();
          }
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="container mx-auto mt-10 px-4 pb-16"><div class="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"><div class="min-w-0 space-y-8">`);
      if (__props.anime.synopsis) {
        _push(`<section><div class="mb-3 font-mono text-[11px] uppercase tracking-[0.1em] text-gray-500">Synopsis</div><div class="prose prose-invert prose-p:text-gray-200 prose-p:leading-relaxed max-w-none text-[15px]"><div>${__props.anime.synopsis ?? ""}</div></div></section>`);
      } else {
        _push(`<!---->`);
      }
      if (availableTabs.value.length) {
        _push(`<section><div class="flex items-center gap-1 overflow-x-auto border-b border-gray-800 [-ms-overflow-style:none] [scrollbar-width:none] [&amp;::-webkit-scrollbar]:hidden"><!--[-->`);
        ssrRenderList(availableTabs.value, (t3) => {
          _push(`<button type="button" class="${ssrRenderClass([currentTab.value === t3.key ? "border-primary-400 font-medium text-primary-400" : "border-transparent text-gray-400 hover:text-gray-200", "-mb-px whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm transition"])}">${ssrInterpolate(t3.label)}</button>`);
        });
        _push(`<!--]--></div><div class="pt-5">`);
        if (currentTab.value === "trailer" && __props.anime.trailer_url && embedUrl(__props.anime.trailer_url)) {
          _push(`<div><div class="aspect-video overflow-hidden rounded-xl border border-gray-800 bg-gray-900"><iframe${ssrRenderAttr("src", embedUrl(__props.anime.trailer_url))} class="h-full w-full" allowfullscreen loading="lazy"></iframe></div></div>`);
        } else if (currentTab.value === "franchise") {
          _push(`<div><div class="mb-4 flex items-baseline justify-between"><div><div class="font-mono text-[11px] uppercase tracking-[0.08em] text-gray-500">Franchise timeline</div><div class="mt-1 text-sm text-gray-400">${ssrInterpolate(__props.seasons.length)} entries</div></div></div><div class="relative pl-7"><div class="absolute bottom-2 left-[11px] top-2 w-px bg-gray-800"></div><!--[-->`);
          ssrRenderList(__props.seasons, (s2, i2) => {
            _push(`<div class="relative pb-3 last:pb-0"><div class="${ssrRenderClass([s2.is_current ? "border-primary-400 bg-primary-400 shadow-[0_0_0_4px_rgba(129,140,248,0.15)]" : "border-gray-700 bg-gray-900", "absolute -left-[22px] top-5 flex h-4 w-4 items-center justify-center rounded-full border-2"])}"></div>`);
            ssrRenderVNode(_push, createVNode(resolveDynamicComponent(s2.slug && !s2.is_current ? "Link" : "div"), mergeProps({ ref_for: true }, s2.slug && !s2.is_current ? { href: _ctx.route("anime.show", { anime: s2.slug }) } : {}, {
              class: ["flex items-center gap-4 rounded-xl border bg-gray-900/50 p-3 transition", s2.is_current ? "border-primary-400/60" : "border-gray-800 hover:border-gray-700"]
            }), {
              default: withCtx((_2, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`<div class="h-[78px] w-[56px] shrink-0 overflow-hidden rounded-md bg-gray-800"${_scopeId}>`);
                  if (s2.cover_image_large || s2.cover_image_medium) {
                    _push2(`<img${ssrRenderAttr("src", (s2.cover_image_large || s2.cover_image_medium) ?? void 0)}${ssrRenderAttr("alt", s2.title_english || s2.title_romaji)} class="h-full w-full object-cover" loading="lazy"${_scopeId}>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</div><div class="min-w-0 flex-1"${_scopeId}><div class="mb-1 flex flex-wrap items-center gap-2"${_scopeId}><span class="font-mono text-[10px] uppercase tracking-[0.08em] text-gray-500"${_scopeId}> Season ${ssrInterpolate(i2 + 1)}</span>`);
                  if (s2.is_current) {
                    _push2(`<span class="rounded-full bg-primary-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary-300"${_scopeId}> Currently watching </span>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</div><div class="truncate text-sm font-medium text-gray-100"${_scopeId}>${ssrInterpolate(s2.title_english || s2.title_romaji)}</div><div class="mt-1 font-mono text-xs text-gray-500"${_scopeId}>${ssrInterpolate(formatLabel(s2.format))} · ${ssrInterpolate(s2.episodes ?? "?")} ep </div></div>`);
                  _push2(ssrRenderComponent(_sfc_main$H, {
                    score: s2.average_score,
                    size: "sm"
                  }, null, _parent2, _scopeId));
                } else {
                  return [
                    createVNode("div", { class: "h-[78px] w-[56px] shrink-0 overflow-hidden rounded-md bg-gray-800" }, [
                      s2.cover_image_large || s2.cover_image_medium ? (openBlock(), createBlock("img", {
                        key: 0,
                        src: (s2.cover_image_large || s2.cover_image_medium) ?? void 0,
                        alt: s2.title_english || s2.title_romaji,
                        class: "h-full w-full object-cover",
                        loading: "lazy"
                      }, null, 8, ["src", "alt"])) : createCommentVNode("", true)
                    ]),
                    createVNode("div", { class: "min-w-0 flex-1" }, [
                      createVNode("div", { class: "mb-1 flex flex-wrap items-center gap-2" }, [
                        createVNode("span", { class: "font-mono text-[10px] uppercase tracking-[0.08em] text-gray-500" }, " Season " + toDisplayString(i2 + 1), 1),
                        s2.is_current ? (openBlock(), createBlock("span", {
                          key: 0,
                          class: "rounded-full bg-primary-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary-300"
                        }, " Currently watching ")) : createCommentVNode("", true)
                      ]),
                      createVNode("div", { class: "truncate text-sm font-medium text-gray-100" }, toDisplayString(s2.title_english || s2.title_romaji), 1),
                      createVNode("div", { class: "mt-1 font-mono text-xs text-gray-500" }, toDisplayString(formatLabel(s2.format)) + " · " + toDisplayString(s2.episodes ?? "?") + " ep ", 1)
                    ]),
                    createVNode(_sfc_main$H, {
                      score: s2.average_score,
                      size: "sm"
                    }, null, 8, ["score"])
                  ];
                }
              }),
              _: 2
            }), _parent);
            _push(`</div>`);
          });
          _push(`<!--]--></div></div>`);
        } else if (currentTab.value === "episodes") {
          _push(`<div><div class="mb-3 flex flex-wrap items-center gap-1.5"><!--[-->`);
          ssrRenderList(EPISODE_FILTERS, (f2) => {
            _push(`<button type="button" class="${ssrRenderClass([episodeFilter.value === f2 ? "border-primary-400 bg-primary-400/10 text-primary-300" : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200", "rounded-full border px-3 py-1 text-xs transition"])}"><span class="capitalize">${ssrInterpolate(f2)}</span><span class="ml-1.5 font-mono text-[11px] text-gray-500">${ssrInterpolate(episodeCounts.value[f2])}</span></button>`);
          });
          _push(`<!--]--></div>`);
          if (!filteredEpisodes.value.length) {
            _push(`<div class="rounded-xl border border-dashed border-gray-700 bg-gray-900/30 px-6 py-10 text-center text-sm text-gray-500"> No episodes match this filter. </div>`);
          } else {
            _push(`<div class="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50"><div class="hidden grid-cols-[3rem_minmax(0,1fr)_10rem_5rem_4rem] gap-3 border-b border-gray-800 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-gray-500 md:grid"><div>EP</div><div>Title</div><div>Air date</div><div>Runtime</div><div class="text-right">Score</div></div><!--[-->`);
            ssrRenderList(filteredEpisodes.value, (ep, i2) => {
              _push(`<div class="${ssrRenderClass([i2 > 0 ? "border-t border-gray-800" : "", "grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 md:grid-cols-[3rem_minmax(0,1fr)_10rem_5rem_4rem]"])}"><div class="font-mono text-xs font-semibold text-primary-400">${ssrInterpolate(String(ep.number).padStart(2, "0"))}</div><div class="min-w-0"><div class="flex flex-wrap items-center gap-2"><span class="truncate text-sm font-medium text-gray-100">${ssrInterpolate(ep.title || `Episode ${ep.number}`)}</span>`);
              if (ep.status === "upcoming") {
                _push(`<span class="rounded-full bg-primary-400/10 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-primary-300"> Upcoming </span>`);
              } else if (ep.status === "unknown") {
                _push(`<span class="rounded-full border border-dashed border-gray-700 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-gray-500"> TBA </span>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</div><div class="mt-1 flex items-center gap-2 text-[11px] text-gray-500 md:hidden">`);
              if (ep.air_date) {
                _push(`<span class="font-mono">${ssrInterpolate(unref(formatLocalDate)(ep.air_date))}</span>`);
              } else {
                _push(`<!---->`);
              }
              if (ep.air_date && ep.status === "upcoming") {
                _push(`<span class="font-mono text-primary-400"> · ${ssrInterpolate(unref(formatCountdown)(ep.air_date))}</span>`);
              } else {
                _push(`<!---->`);
              }
              if (ep.runtime_minutes) {
                _push(`<span class="font-mono">· ${ssrInterpolate(ep.runtime_minutes)}m</span>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</div></div><div class="hidden font-mono text-xs text-gray-400 md:block">`);
              if (ep.air_date) {
                _push(`<!--[--><div>${ssrInterpolate(unref(formatLocalDate)(ep.air_date))}</div>`);
                if (ep.status === "upcoming") {
                  _push(`<div class="text-primary-400">${ssrInterpolate(unref(formatCountdown)(ep.air_date))}</div>`);
                } else {
                  _push(`<!---->`);
                }
                _push(`<!--]-->`);
              } else {
                _push(`<span class="text-gray-600">—</span>`);
              }
              _push(`</div><div class="hidden font-mono text-xs text-gray-400 md:block">`);
              if (ep.runtime_minutes) {
                _push(`<!--[-->${ssrInterpolate(ep.runtime_minutes)} min<!--]-->`);
              } else {
                _push(`<span class="text-gray-600">—</span>`);
              }
              _push(`</div><div class="text-right">`);
              if (ep.score != null) {
                _push(ssrRenderComponent(_sfc_main$H, {
                  score: ep.score / 10,
                  size: "sm"
                }, null, _parent));
              } else {
                _push(`<span class="font-mono text-xs text-gray-600">—</span>`);
              }
              _push(`</div></div>`);
            });
            _push(`<!--]--></div>`);
          }
          _push(`</div>`);
        } else if (currentTab.value === "schedule") {
          _push(`<div class="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50"><!--[-->`);
          ssrRenderList(schedules.value, (s2, i2) => {
            _push(`<div class="${ssrRenderClass([i2 > 0 ? "border-t border-gray-800" : "", "flex items-center gap-4 px-4 py-3"])}"><div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-800 font-mono text-xs font-semibold text-gray-300">${ssrInterpolate(String(s2.episode).padStart(2, "0"))}</div><div class="flex-1"><div class="text-sm font-medium text-gray-100">Episode ${ssrInterpolate(s2.episode)}</div><div class="mt-0.5 font-mono text-[11px] text-gray-500">${ssrInterpolate(unref(formatLocalDate)(s2.airs_at))}</div></div><div class="font-mono text-xs font-medium text-primary-400">${ssrInterpolate(unref(formatCountdown)(s2.airs_at))}</div></div>`);
          });
          _push(`<!--]--></div>`);
        } else if (currentTab.value === "characters") {
          _push(`<div class="grid grid-cols-1 gap-2 sm:grid-cols-2"><!--[-->`);
          ssrRenderList(displayCharacters.value.slice(0, 20), (char) => {
            _push(`<div class="overflow-hidden rounded-lg border border-gray-800 bg-gray-900/50"><div class="flex items-stretch justify-between gap-2"><div class="flex min-w-0 flex-1 items-center gap-2 p-2"><div class="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-gray-800">`);
            if (char.image_medium) {
              _push(`<img${ssrRenderAttr("src", char.image_medium)}${ssrRenderAttr("alt", char.name_full)} class="h-full w-full object-cover" loading="lazy">`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div><div class="min-w-0"><p class="truncate text-sm font-medium text-gray-100">${ssrInterpolate(char.name_full)}</p>`);
            if (char.role) {
              _push(`<p class="font-mono text-[10px] uppercase tracking-wider text-gray-500">${ssrInterpolate(char.role === "MAIN" ? "Main" : char.role === "SUPPORTING" ? "Supporting" : "Background")}</p>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div></div>`);
            if (char.voice_actors?.length) {
              _push(`<div class="flex min-w-0 flex-1 flex-col justify-center gap-1 p-2"><!--[-->`);
              ssrRenderList(sortedVoiceActors(char.voice_actors), (va) => {
                _push(`<div class="flex items-center justify-end gap-2"><span class="shrink-0 rounded bg-gray-800 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-gray-400">${ssrInterpolate(languageLabel(va.language))}</span><div class="min-w-0 text-right">`);
                ssrRenderVNode(_push, createVNode(resolveDynamicComponent(unref(voiceActorPagesEnabled) && voiceActorRoute(va) ? "Link" : "span"), mergeProps({ ref_for: true }, unref(voiceActorPagesEnabled) && voiceActorRoute(va) ? { href: voiceActorRoute(va) } : {}, {
                  class: ["block truncate text-sm", unref(voiceActorPagesEnabled) && voiceActorRoute(va) ? "text-primary-400 hover:text-primary-300 transition" : "text-gray-300"]
                }), {
                  default: withCtx((_2, _push2, _parent2, _scopeId) => {
                    if (_push2) {
                      _push2(`${ssrInterpolate(va.name_full)}`);
                    } else {
                      return [
                        createTextVNode(toDisplayString(va.name_full), 1)
                      ];
                    }
                  }),
                  _: 2
                }), _parent);
                _push(`</div><div class="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-gray-800">`);
                if (va.image_medium) {
                  _push(`<img${ssrRenderAttr("src", va.image_medium)}${ssrRenderAttr("alt", va.name_full)} class="h-full w-full object-cover" loading="lazy">`);
                } else {
                  _push(`<!---->`);
                }
                _push(`</div></div>`);
              });
              _push(`<!--]--></div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div></div>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></section>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><aside class="space-y-4"><div class="rounded-xl border border-gray-800 bg-gray-900/50 p-5"><div class="grid grid-cols-2 gap-x-4 gap-y-4"><div><div class="mb-1 font-mono text-[10px] uppercase tracking-[0.1em] text-gray-500">Score</div><div class="text-sm font-medium text-gray-100">★ ${ssrInterpolate(displayScore())}</div></div>`);
      if (__props.anime.popularity) {
        _push(`<div><div class="mb-1 font-mono text-[10px] uppercase tracking-[0.1em] text-gray-500">Popularity</div><div class="text-sm font-medium text-gray-100">#${ssrInterpolate(__props.anime.popularity.toLocaleString())}</div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div><div class="mb-1 font-mono text-[10px] uppercase tracking-[0.1em] text-gray-500">Format</div><div class="text-sm font-medium text-gray-100">${ssrInterpolate(formatLabel(__props.anime.format))}</div></div><div><div class="mb-1 font-mono text-[10px] uppercase tracking-[0.1em] text-gray-500">Episodes</div><div class="text-sm font-medium text-gray-100">${ssrInterpolate(__props.anime.episodes ?? "?")}</div></div>`);
      if (__props.anime.duration) {
        _push(`<div><div class="mb-1 font-mono text-[10px] uppercase tracking-[0.1em] text-gray-500">Duration</div><div class="text-sm font-medium text-gray-100">${ssrInterpolate(__props.anime.duration)} min</div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.anime.season && __props.anime.season_year) {
        _push(`<div><div class="mb-1 font-mono text-[10px] uppercase tracking-[0.1em] text-gray-500">Season</div><div class="text-sm font-medium text-gray-100">${ssrInterpolate(seasonLabel(__props.anime.season, __props.anime.season_year))}</div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.anime.aired_from) {
        _push(`<div class="col-span-2"><div class="mb-1 font-mono text-[10px] uppercase tracking-[0.1em] text-gray-500">Aired</div><div class="text-sm font-medium text-gray-100">${ssrInterpolate(formatDate(__props.anime.aired_from))} `);
        if (__props.anime.aired_to) {
          _push(`<span> – ${ssrInterpolate(formatDate(__props.anime.aired_to))}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.anime.source) {
        _push(`<div><div class="mb-1 font-mono text-[10px] uppercase tracking-[0.1em] text-gray-500">Source</div><div class="text-sm font-medium text-gray-100">${ssrInterpolate(sourceLabel(__props.anime.source))}</div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div><div class="mb-1 font-mono text-[10px] uppercase tracking-[0.1em] text-gray-500">Status</div><div class="text-sm font-medium text-gray-100">${ssrInterpolate(statusLabel(__props.anime.status))}</div></div></div>`);
      if (mainStudios.value.length) {
        _push(`<div class="mt-5 border-t border-gray-800 pt-4"><div class="mb-2 font-mono text-[10px] uppercase tracking-[0.1em] text-gray-500"> Studio${ssrInterpolate(mainStudios.value.length > 1 ? "s" : "")}</div><div class="flex flex-wrap gap-1.5"><!--[-->`);
        ssrRenderList(mainStudios.value, (s2) => {
          ssrRenderVNode(_push, createVNode(resolveDynamicComponent(unref(studioPagesEnabled) && studioRoute(s2) ? "Link" : "span"), mergeProps({
            key: s2.id
          }, { ref_for: true }, unref(studioPagesEnabled) && studioRoute(s2) ? { href: studioRoute(s2) } : {}, {
            class: ["rounded-full border border-gray-700 bg-gray-800 px-2.5 py-1 text-xs font-medium transition", unref(studioPagesEnabled) && studioRoute(s2) ? "text-gray-100 hover:border-primary-400 hover:text-primary-300" : "text-gray-200"]
          }), {
            default: withCtx((_2, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(s2.name)}`);
              } else {
                return [
                  createTextVNode(toDisplayString(s2.name), 1)
                ];
              }
            }),
            _: 2
          }), _parent);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (otherStudios.value.length) {
        _push(`<div class="mt-4"><div class="mb-2 font-mono text-[10px] uppercase tracking-[0.1em] text-gray-500">Producers</div><div class="flex flex-wrap gap-1.5"><!--[-->`);
        ssrRenderList(otherStudios.value, (s2) => {
          ssrRenderVNode(_push, createVNode(resolveDynamicComponent(unref(studioPagesEnabled) && studioRoute(s2) ? "Link" : "span"), mergeProps({
            key: s2.id
          }, { ref_for: true }, unref(studioPagesEnabled) && studioRoute(s2) ? { href: studioRoute(s2) } : {}, {
            class: ["rounded-full border border-gray-700 px-2.5 py-1 text-xs transition", unref(studioPagesEnabled) && studioRoute(s2) ? "text-gray-300 hover:border-primary-400 hover:text-primary-300" : "text-gray-300"]
          }), {
            default: withCtx((_2, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(s2.name)}`);
              } else {
                return [
                  createTextVNode(toDisplayString(s2.name), 1)
                ];
              }
            }),
            _: 2
          }), _parent);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (__props.anime.external_ids?.length) {
        _push(`<div class="rounded-xl border border-gray-800 bg-gray-900/50 p-5"><div class="mb-3 font-mono text-[11px] uppercase tracking-[0.1em] text-gray-500">External links</div><div class="flex flex-wrap gap-1.5"><!--[-->`);
        ssrRenderList(__props.anime.external_ids, (link) => {
          _push(`<a${ssrRenderAttr("href", link.url ?? "#")} target="_blank" rel="noopener noreferrer" class="rounded-full border border-gray-700 px-2.5 py-1 text-xs text-gray-300 transition hover:border-primary-400 hover:text-primary-300">${ssrInterpolate(link.platform)}</a>`);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (relations.value.length) {
        _push(`<div class="rounded-xl border border-gray-800 bg-gray-900/50 p-5"><div class="mb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-gray-500">Related</div><!--[-->`);
        ssrRenderList(relations.value.slice(0, 4), (rel) => {
          _push(ssrRenderComponent(_component_Link, {
            key: rel.id,
            href: rel.related_anime?.slug ? _ctx.route("anime.show", { anime: rel.related_anime.slug }) : "#",
            class: "group flex items-center gap-3 border-t border-gray-800 py-2.5 first:border-t-0"
          }, {
            default: withCtx((_2, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<div class="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-gray-800"${_scopeId}>`);
                if (rel.related_anime?.cover_image_medium) {
                  _push2(`<img${ssrRenderAttr("src", rel.related_anime.cover_image_medium)}${ssrRenderAttr("alt", rel.related_anime?.title_english || rel.related_anime?.title_romaji)} class="h-full w-full object-cover" loading="lazy"${_scopeId}>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div><div class="min-w-0 flex-1"${_scopeId}><div class="truncate text-sm font-medium text-gray-200 transition group-hover:text-primary-300"${_scopeId}>${ssrInterpolate(rel.related_anime?.title_english || rel.related_anime?.title_romaji)}</div><div class="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-gray-500"${_scopeId}>${ssrInterpolate(relationLabel(rel.relation_type))}</div></div>`);
              } else {
                return [
                  createVNode("div", { class: "h-14 w-10 shrink-0 overflow-hidden rounded-md bg-gray-800" }, [
                    rel.related_anime?.cover_image_medium ? (openBlock(), createBlock("img", {
                      key: 0,
                      src: rel.related_anime.cover_image_medium,
                      alt: rel.related_anime?.title_english || rel.related_anime?.title_romaji,
                      class: "h-full w-full object-cover",
                      loading: "lazy"
                    }, null, 8, ["src", "alt"])) : createCommentVNode("", true)
                  ]),
                  createVNode("div", { class: "min-w-0 flex-1" }, [
                    createVNode("div", { class: "truncate text-sm font-medium text-gray-200 transition group-hover:text-primary-300" }, toDisplayString(rel.related_anime?.title_english || rel.related_anime?.title_romaji), 1),
                    createVNode("div", { class: "mt-0.5 font-mono text-[10px] uppercase tracking-wider text-gray-500" }, toDisplayString(relationLabel(rel.relation_type)), 1)
                  ])
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</aside></div>`);
      if (__props.recommendations.length) {
        _push(`<div class="mt-14 border-t border-gray-800 pt-10"><div class="mb-5"><div class="font-mono text-[11px] uppercase tracking-[0.1em] text-gray-500">If you like this, try</div><h2 class="mt-1 text-xl font-semibold text-gray-100">You might also enjoy</h2></div><div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8"><!--[-->`);
        ssrRenderList(__props.recommendations, (rec) => {
          _push(ssrRenderComponent(_component_Link, {
            key: rec.id ?? rec.anilist_id,
            href: rec.slug ? _ctx.route("anime.show", { anime: rec.slug }) : "#",
            class: "group"
          }, {
            default: withCtx((_2, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<div class="aspect-[3/4] overflow-hidden rounded-lg bg-gray-800 transition group-hover:ring-1 group-hover:ring-gray-600"${_scopeId}>`);
                if (rec.cover_image_large || rec.cover_image_medium) {
                  _push2(`<img${ssrRenderAttr("src", (rec.cover_image_large || rec.cover_image_medium) ?? void 0)}${ssrRenderAttr("alt", rec.title_english || rec.title_romaji)} class="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy"${_scopeId}>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div><div class="mt-2 line-clamp-2 text-xs font-medium text-gray-200 transition group-hover:text-primary-300"${_scopeId}>${ssrInterpolate(rec.title_english || rec.title_romaji)}</div><div class="mt-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-gray-500"${_scopeId}>`);
                if (rec.average_score != null) {
                  _push2(`<span${_scopeId}>★ ${ssrInterpolate(rec.average_score.toFixed(1))}</span>`);
                } else {
                  _push2(`<!---->`);
                }
                if (rec.average_score != null && rec.format) {
                  _push2(`<span${_scopeId}>·</span>`);
                } else {
                  _push2(`<!---->`);
                }
                if (rec.format) {
                  _push2(`<span${_scopeId}>${ssrInterpolate(rec.format.replace(/_/g, " "))}</span>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div>`);
              } else {
                return [
                  createVNode("div", { class: "aspect-[3/4] overflow-hidden rounded-lg bg-gray-800 transition group-hover:ring-1 group-hover:ring-gray-600" }, [
                    rec.cover_image_large || rec.cover_image_medium ? (openBlock(), createBlock("img", {
                      key: 0,
                      src: (rec.cover_image_large || rec.cover_image_medium) ?? void 0,
                      alt: rec.title_english || rec.title_romaji,
                      class: "h-full w-full object-cover transition-transform group-hover:scale-105",
                      loading: "lazy"
                    }, null, 8, ["src", "alt"])) : createCommentVNode("", true)
                  ]),
                  createVNode("div", { class: "mt-2 line-clamp-2 text-xs font-medium text-gray-200 transition group-hover:text-primary-300" }, toDisplayString(rec.title_english || rec.title_romaji), 1),
                  createVNode("div", { class: "mt-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-gray-500" }, [
                    rec.average_score != null ? (openBlock(), createBlock("span", { key: 0 }, "★ " + toDisplayString(rec.average_score.toFixed(1)), 1)) : createCommentVNode("", true),
                    rec.average_score != null && rec.format ? (openBlock(), createBlock("span", { key: 1 }, "·")) : createCommentVNode("", true),
                    rec.format ? (openBlock(), createBlock("span", { key: 2 }, toDisplayString(rec.format.replace(/_/g, " ")), 1)) : createCommentVNode("", true)
                  ])
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><!--]-->`);
    };
  }
});
const _sfc_setup$E = _sfc_main$E.setup;
_sfc_main$E.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/AnimeDetailPage.vue");
  return _sfc_setup$E ? _sfc_setup$E(props, ctx) : void 0;
};
const __vite_glob_0_8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main$E
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main$D = /* @__PURE__ */ defineComponent({
  __name: "GenreBadge",
  __ssrInlineRender: true,
  props: {
    name: {}
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Link = resolveComponent("Link");
      _push(ssrRenderComponent(_component_Link, mergeProps({
        href: _ctx.route("anime.index", { "filter[genre]": __props.name }),
        class: "inline-block rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-300 transition hover:bg-primary-600/20 hover:text-primary-400"
      }, _attrs), {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`${ssrInterpolate(__props.name)}`);
          } else {
            return [
              createTextVNode(toDisplayString(__props.name), 1)
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup$D = _sfc_main$D.setup;
_sfc_main$D.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/GenreBadge.vue");
  return _sfc_setup$D ? _sfc_setup$D(props, ctx) : void 0;
};
const _sfc_main$C = /* @__PURE__ */ defineComponent({
  __name: "AnimeCard",
  __ssrInlineRender: true,
  props: {
    anime: {},
    viewMode: {}
  },
  setup(__props) {
    const props = __props;
    const mode = computed(() => props.viewMode ?? "grid");
    function formatLabel(format) {
      if (!format) return "";
      return format.replace(/_/g, " ");
    }
    function episodeText(anime) {
      if (!anime.episodes) return "";
      return `${anime.episodes} ep`;
    }
    function displayTitle(anime) {
      return anime.title_english || anime.title_romaji;
    }
    function animeUrl(anime) {
      if (anime.slug) {
        return route("anime.show", { anime: anime.slug });
      }
      if (anime.anilist_id) {
        return route("anime.show.anilist", { anilistId: anime.anilist_id });
      }
      return "#";
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Link = resolveComponent("Link");
      _push(ssrRenderComponent(_component_Link, mergeProps({
        href: animeUrl(__props.anime),
        class: ["group block", mode.value === "list" ? "flex gap-4" : ""]
      }, _attrs), {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (mode.value === "grid") {
              _push2(`<div class="space-y-2"${_scopeId}><div class="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-800"${_scopeId}>`);
              if (__props.anime.cover_image_large || __props.anime.cover_image_medium) {
                _push2(`<img${ssrRenderAttr("src", (__props.anime.cover_image_large || __props.anime.cover_image_medium) ?? void 0)}${ssrRenderAttr("alt", displayTitle(__props.anime))} class="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy"${_scopeId}>`);
              } else {
                _push2(`<div class="flex h-full items-center justify-center text-gray-600"${_scopeId}><span class="text-4xl"${_scopeId}>?</span></div>`);
              }
              _push2(`<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2"${_scopeId}>`);
              _push2(ssrRenderComponent(_sfc_main$H, {
                score: __props.anime.average_score,
                size: "sm"
              }, null, _parent2, _scopeId));
              _push2(`</div>`);
              if (__props.anime.next_airing_episode) {
                _push2(`<div class="absolute top-2 right-2"${_scopeId}><span class="rounded bg-primary-600 px-1.5 py-0.5 text-[10px] font-semibold text-white"${_scopeId}> EP ${ssrInterpolate(__props.anime.next_airing_episode.episode)}</span></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div><div${_scopeId}><h3 class="line-clamp-2 text-sm font-medium text-gray-200 group-hover:text-primary-400 transition"${_scopeId}>${ssrInterpolate(displayTitle(__props.anime))}</h3><div class="mt-1 flex items-center gap-2 text-xs text-gray-500"${_scopeId}>`);
              if (__props.anime.format) {
                _push2(`<span${_scopeId}>${ssrInterpolate(formatLabel(__props.anime.format))}</span>`);
              } else {
                _push2(`<!---->`);
              }
              if (__props.anime.format && __props.anime.episodes) {
                _push2(`<span class="text-gray-700"${_scopeId}>·</span>`);
              } else {
                _push2(`<!---->`);
              }
              if (__props.anime.episodes) {
                _push2(`<span${_scopeId}>${ssrInterpolate(episodeText(__props.anime))}</span>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div></div></div>`);
            } else {
              _push2(`<!--[--><div class="h-24 w-16 shrink-0 overflow-hidden rounded-md bg-gray-800"${_scopeId}>`);
              if (__props.anime.cover_image_medium) {
                _push2(`<img${ssrRenderAttr("src", __props.anime.cover_image_medium)}${ssrRenderAttr("alt", displayTitle(__props.anime))} class="h-full w-full object-cover" loading="lazy"${_scopeId}>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div><div class="flex min-w-0 flex-1 flex-col justify-center gap-1"${_scopeId}><h3 class="truncate text-sm font-medium text-gray-200 group-hover:text-primary-400 transition"${_scopeId}>${ssrInterpolate(displayTitle(__props.anime))}</h3><div class="flex items-center gap-2 text-xs text-gray-500"${_scopeId}>`);
              if (__props.anime.format) {
                _push2(`<span${_scopeId}>${ssrInterpolate(formatLabel(__props.anime.format))}</span>`);
              } else {
                _push2(`<!---->`);
              }
              if (__props.anime.episodes) {
                _push2(`<span${_scopeId}>${ssrInterpolate(episodeText(__props.anime))}</span>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(ssrRenderComponent(_sfc_main$H, {
                score: __props.anime.average_score,
                size: "sm"
              }, null, _parent2, _scopeId));
              _push2(`</div><div class="flex flex-wrap gap-1"${_scopeId}><!--[-->`);
              ssrRenderList(__props.anime.genres.slice(0, 3), (genre) => {
                _push2(ssrRenderComponent(_sfc_main$D, {
                  key: genre.id,
                  name: genre.name
                }, null, _parent2, _scopeId));
              });
              _push2(`<!--]--></div></div><!--]-->`);
            }
          } else {
            return [
              mode.value === "grid" ? (openBlock(), createBlock("div", {
                key: 0,
                class: "space-y-2"
              }, [
                createVNode("div", { class: "relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-800" }, [
                  __props.anime.cover_image_large || __props.anime.cover_image_medium ? (openBlock(), createBlock("img", {
                    key: 0,
                    src: (__props.anime.cover_image_large || __props.anime.cover_image_medium) ?? void 0,
                    alt: displayTitle(__props.anime),
                    class: "h-full w-full object-cover transition-transform group-hover:scale-105",
                    loading: "lazy"
                  }, null, 8, ["src", "alt"])) : (openBlock(), createBlock("div", {
                    key: 1,
                    class: "flex h-full items-center justify-center text-gray-600"
                  }, [
                    createVNode("span", { class: "text-4xl" }, "?")
                  ])),
                  createVNode("div", { class: "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2" }, [
                    createVNode(_sfc_main$H, {
                      score: __props.anime.average_score,
                      size: "sm"
                    }, null, 8, ["score"])
                  ]),
                  __props.anime.next_airing_episode ? (openBlock(), createBlock("div", {
                    key: 2,
                    class: "absolute top-2 right-2"
                  }, [
                    createVNode("span", { class: "rounded bg-primary-600 px-1.5 py-0.5 text-[10px] font-semibold text-white" }, " EP " + toDisplayString(__props.anime.next_airing_episode.episode), 1)
                  ])) : createCommentVNode("", true)
                ]),
                createVNode("div", null, [
                  createVNode("h3", { class: "line-clamp-2 text-sm font-medium text-gray-200 group-hover:text-primary-400 transition" }, toDisplayString(displayTitle(__props.anime)), 1),
                  createVNode("div", { class: "mt-1 flex items-center gap-2 text-xs text-gray-500" }, [
                    __props.anime.format ? (openBlock(), createBlock("span", { key: 0 }, toDisplayString(formatLabel(__props.anime.format)), 1)) : createCommentVNode("", true),
                    __props.anime.format && __props.anime.episodes ? (openBlock(), createBlock("span", {
                      key: 1,
                      class: "text-gray-700"
                    }, "·")) : createCommentVNode("", true),
                    __props.anime.episodes ? (openBlock(), createBlock("span", { key: 2 }, toDisplayString(episodeText(__props.anime)), 1)) : createCommentVNode("", true)
                  ])
                ])
              ])) : (openBlock(), createBlock(Fragment, { key: 1 }, [
                createVNode("div", { class: "h-24 w-16 shrink-0 overflow-hidden rounded-md bg-gray-800" }, [
                  __props.anime.cover_image_medium ? (openBlock(), createBlock("img", {
                    key: 0,
                    src: __props.anime.cover_image_medium,
                    alt: displayTitle(__props.anime),
                    class: "h-full w-full object-cover",
                    loading: "lazy"
                  }, null, 8, ["src", "alt"])) : createCommentVNode("", true)
                ]),
                createVNode("div", { class: "flex min-w-0 flex-1 flex-col justify-center gap-1" }, [
                  createVNode("h3", { class: "truncate text-sm font-medium text-gray-200 group-hover:text-primary-400 transition" }, toDisplayString(displayTitle(__props.anime)), 1),
                  createVNode("div", { class: "flex items-center gap-2 text-xs text-gray-500" }, [
                    __props.anime.format ? (openBlock(), createBlock("span", { key: 0 }, toDisplayString(formatLabel(__props.anime.format)), 1)) : createCommentVNode("", true),
                    __props.anime.episodes ? (openBlock(), createBlock("span", { key: 1 }, toDisplayString(episodeText(__props.anime)), 1)) : createCommentVNode("", true),
                    createVNode(_sfc_main$H, {
                      score: __props.anime.average_score,
                      size: "sm"
                    }, null, 8, ["score"])
                  ]),
                  createVNode("div", { class: "flex flex-wrap gap-1" }, [
                    (openBlock(true), createBlock(Fragment, null, renderList(__props.anime.genres.slice(0, 3), (genre) => {
                      return openBlock(), createBlock(_sfc_main$D, {
                        key: genre.id,
                        name: genre.name
                      }, null, 8, ["name"]);
                    }), 128))
                  ])
                ])
              ], 64))
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup$C = _sfc_main$C.setup;
_sfc_main$C.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/AnimeCard.vue");
  return _sfc_setup$C ? _sfc_setup$C(props, ctx) : void 0;
};
const _sfc_main$B = /* @__PURE__ */ defineComponent({
  __name: "FilterSidebar",
  __ssrInlineRender: true,
  props: {
    filters: {},
    genres: {},
    studios: {}
  },
  emits: ["update:filters", "apply", "clear"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const formatOptions = [
      { id: "TV", name: "TV" },
      { id: "TV_SHORT", name: "TV Short" },
      { id: "MOVIE", name: "Movie" },
      { id: "OVA", name: "OVA" },
      { id: "ONA", name: "ONA" },
      { id: "SPECIAL", name: "Special" },
      { id: "MUSIC", name: "Music" }
    ];
    const statusOptions = [
      { id: "RELEASING", name: "Airing" },
      { id: "FINISHED", name: "Finished" },
      { id: "NOT_YET_RELEASED", name: "Not Yet Aired" },
      { id: "CANCELLED", name: "Cancelled" },
      { id: "HIATUS", name: "Hiatus" }
    ];
    const seasonOptions = [
      { id: "WINTER", name: "Winter" },
      { id: "SPRING", name: "Spring" },
      { id: "SUMMER", name: "Summer" },
      { id: "FALL", name: "Fall" }
    ];
    const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    const yearOptions = Array.from({ length: currentYear - 1939 }, (_2, i2) => ({
      id: currentYear + 1 - i2,
      name: String(currentYear + 1 - i2)
    }));
    function updateFilter(key, value) {
      emit("update:filters", { ...props.filters, [key]: value || void 0 });
      emit("apply");
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "space-y-4" }, _attrs))}><div><label class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-400">Format</label>`);
      _push(ssrRenderComponent(unref(Select), {
        "model-value": __props.filters.format,
        options: formatOptions,
        "option-label": "name",
        "option-value": "id",
        placeholder: "Any",
        "show-clear": "",
        class: "w-full",
        "onUpdate:modelValue": ($event) => updateFilter("format", $event)
      }, null, _parent));
      _push(`</div><div><label class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-400">Status</label>`);
      _push(ssrRenderComponent(unref(Select), {
        "model-value": __props.filters.status,
        options: statusOptions,
        "option-label": "name",
        "option-value": "id",
        placeholder: "Any",
        "show-clear": "",
        class: "w-full",
        "onUpdate:modelValue": ($event) => updateFilter("status", $event)
      }, null, _parent));
      _push(`</div><div><label class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-400">Season</label>`);
      _push(ssrRenderComponent(unref(Select), {
        "model-value": __props.filters.season,
        options: seasonOptions,
        "option-label": "name",
        "option-value": "id",
        placeholder: "Any",
        "show-clear": "",
        class: "w-full",
        "onUpdate:modelValue": ($event) => updateFilter("season", $event)
      }, null, _parent));
      _push(`</div><div><label class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-400">Year</label>`);
      _push(ssrRenderComponent(unref(Select), {
        "model-value": __props.filters.season_year,
        options: unref(yearOptions),
        "option-label": "name",
        "option-value": "id",
        placeholder: "Any",
        "show-clear": "",
        class: "w-full",
        "onUpdate:modelValue": ($event) => updateFilter("season_year", $event)
      }, null, _parent));
      _push(`</div><div><label class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-400">Genre</label>`);
      _push(ssrRenderComponent(unref(Select), {
        "model-value": __props.filters.genre,
        options: __props.genres,
        "option-label": "name",
        "option-value": "name",
        placeholder: "Any",
        "show-clear": "",
        filter: "",
        class: "w-full",
        "onUpdate:modelValue": ($event) => updateFilter("genre", $event)
      }, null, _parent));
      _push(`</div><div><label class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-400">Studio</label>`);
      _push(ssrRenderComponent(unref(Select), {
        "model-value": __props.filters.studio,
        options: __props.studios,
        "option-label": "name",
        "option-value": "id",
        placeholder: "Any",
        "show-clear": "",
        filter: "",
        class: "w-full",
        "onUpdate:modelValue": ($event) => updateFilter("studio", $event)
      }, null, _parent));
      _push(`</div><button class="w-full rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 transition hover:bg-gray-800 hover:text-gray-200"> Clear Filters </button></div>`);
    };
  }
});
const _sfc_setup$B = _sfc_main$B.setup;
_sfc_main$B.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/FilterSidebar.vue");
  return _sfc_setup$B ? _sfc_setup$B(props, ctx) : void 0;
};
const _sfc_main$A = /* @__PURE__ */ defineComponent({
  __name: "SortBar",
  __ssrInlineRender: true,
  props: {
    sort: {},
    total: {},
    viewMode: {}
  },
  emits: ["update:sort", "update:viewMode"],
  setup(__props, { emit: __emit }) {
    const sortOptions = [
      { id: "-popularity", name: "Popularity" },
      { id: "-average_score", name: "Score" },
      { id: "-trending", name: "Trending" },
      { id: "-favourites", name: "Favourites" },
      { id: "title_romaji", name: "Title (A-Z)" },
      { id: "-title_romaji", name: "Title (Z-A)" },
      { id: "-aired_from", name: "Newest" },
      { id: "aired_from", name: "Oldest" }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex flex-wrap items-center justify-between gap-3" }, _attrs))}><p class="text-sm text-gray-400">${ssrInterpolate(__props.total.toLocaleString())} results </p><div class="flex items-center gap-3">`);
      _push(ssrRenderComponent(unref(Select), {
        "model-value": __props.sort || "-popularity",
        options: sortOptions,
        "option-label": "name",
        "option-value": "id",
        class: "w-44",
        "onUpdate:modelValue": ($event) => _ctx.$emit("update:sort", $event)
      }, null, _parent));
      _push(`<div class="flex rounded-lg border border-gray-700"><button class="${ssrRenderClass([__props.viewMode === "grid" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300", "px-2.5 py-1.5 text-sm transition"])}" title="Grid view"><svg class="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3z"></path></svg></button><button class="${ssrRenderClass([__props.viewMode === "list" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300", "px-2.5 py-1.5 text-sm transition"])}" title="List view"><svg class="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"></path></svg></button></div></div></div>`);
    };
  }
});
const _sfc_setup$A = _sfc_main$A.setup;
_sfc_main$A.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/SortBar.vue");
  return _sfc_setup$A ? _sfc_setup$A(props, ctx) : void 0;
};
function useBrowseFilters() {
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const filters = reactive({
    search: params.get("filter[search]") || void 0,
    format: params.get("filter[format]") || void 0,
    status: params.get("filter[status]") || void 0,
    season: params.get("filter[season]") || void 0,
    season_year: params.get("filter[season_year]") ? Number(params.get("filter[season_year]")) : void 0,
    genre: params.get("filter[genre]") || void 0,
    studio: params.get("filter[studio]") ? Number(params.get("filter[studio]")) : void 0,
    sort: params.get("sort") || void 0
  });
  function applyFilters() {
    const query = {};
    if (filters.search && filters.search.trim()) query["filter[search]"] = filters.search.trim();
    if (filters.format) query["filter[format]"] = filters.format;
    if (filters.status) query["filter[status]"] = filters.status;
    if (filters.season) query["filter[season]"] = filters.season;
    if (filters.season_year) query["filter[season_year]"] = String(filters.season_year);
    if (filters.genre) query["filter[genre]"] = filters.genre;
    if (filters.studio) query["filter[studio]"] = String(filters.studio);
    if (filters.sort) query["sort"] = filters.sort;
    router.get(route("anime.index"), query, {
      preserveState: true,
      preserveScroll: false
    });
  }
  function clearFilters() {
    filters.search = void 0;
    filters.format = void 0;
    filters.status = void 0;
    filters.season = void 0;
    filters.season_year = void 0;
    filters.genre = void 0;
    filters.studio = void 0;
    filters.sort = void 0;
    applyFilters();
  }
  const hasActiveFilters = computed(() => {
    return !!(filters.search || filters.format || filters.status || filters.season || filters.season_year || filters.genre || filters.studio);
  });
  return {
    filters,
    applyFilters,
    clearFilters,
    hasActiveFilters
  };
}
const _sfc_main$z = /* @__PURE__ */ defineComponent({
  ...{ layout: _sfc_main$T },
  __name: "AnimeIndexPage",
  __ssrInlineRender: true,
  props: {
    anime: {},
    genres: {},
    studios: {}
  },
  setup(__props) {
    const { filters, applyFilters, clearFilters } = useBrowseFilters();
    const viewMode = ref(
      typeof window !== "undefined" && localStorage.getItem("browse_view") || "grid"
    );
    function setViewMode(mode) {
      viewMode.value = mode;
      if (typeof window !== "undefined") {
        localStorage.setItem("browse_view", mode);
      }
    }
    function updateSort(sort) {
      filters.sort = sort;
      applyFilters();
    }
    function updateFilters(newFilters) {
      Object.assign(filters, newFilters);
    }
    const showMobileFilters = ref(false);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Head = resolveComponent("Head");
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_Head, { title: "Browse & Search Anime" }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<meta name="description" content="Browse, search and discover anime by title, genre, format, season, and more on AniTrack."${_scopeId}><link rel="canonical"${ssrRenderAttr("href", _ctx.route("anime.index"))}${_scopeId}>`);
          } else {
            return [
              createVNode("meta", {
                name: "description",
                content: "Browse, search and discover anime by title, genre, format, season, and more on AniTrack."
              }),
              createVNode("link", {
                rel: "canonical",
                href: _ctx.route("anime.index")
              }, null, 8, ["href"])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div class="mb-6"><form><div class="relative"><input${ssrRenderAttr("value", unref(filters).search)} type="search" placeholder="Search by title..." class="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-gray-200 placeholder-gray-500 outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500"></div></form></div><div class="flex gap-6"><aside class="hidden w-56 shrink-0 lg:block"><div class="sticky top-20"><h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Filters</h2>`);
      _push(ssrRenderComponent(_sfc_main$B, {
        filters: unref(filters),
        genres: __props.genres,
        studios: __props.studios,
        "onUpdate:filters": updateFilters,
        onApply: unref(applyFilters),
        onClear: unref(clearFilters)
      }, null, _parent));
      _push(`</div></aside><div class="min-w-0 flex-1"><button class="mb-4 rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 lg:hidden"> Filters </button>`);
      if (showMobileFilters.value) {
        _push(`<div class="mb-4 rounded-lg border border-gray-800 p-4 lg:hidden">`);
        _push(ssrRenderComponent(_sfc_main$B, {
          filters: unref(filters),
          genres: __props.genres,
          studios: __props.studios,
          "onUpdate:filters": updateFilters,
          onApply: unref(applyFilters),
          onClear: unref(clearFilters)
        }, null, _parent));
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(_sfc_main$A, {
        sort: unref(filters).sort,
        total: __props.anime.meta.total,
        "view-mode": viewMode.value,
        "onUpdate:sort": updateSort,
        "onUpdate:viewMode": setViewMode
      }, null, _parent));
      _push(`<div class="mt-4">`);
      if (__props.anime.data.length) {
        _push(`<div class="${ssrRenderClass(viewMode.value === "grid" ? "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" : "space-y-3")}"><!--[-->`);
        ssrRenderList(__props.anime.data, (item) => {
          _push(ssrRenderComponent(_sfc_main$C, {
            key: item.id ?? item.anilist_id,
            anime: item,
            "view-mode": viewMode.value
          }, null, _parent));
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<div class="py-16 text-center"><p class="text-gray-500">No anime found matching your filters.</p><button class="mt-2 text-sm text-primary-400 hover:text-primary-300"> Clear all filters </button></div>`);
      }
      _push(`</div><div class="mt-8">`);
      _push(ssrRenderComponent(_sfc_main$Q, {
        "current-page": __props.anime.meta.current_page,
        "last-page": __props.anime.meta.last_page,
        total: __props.anime.meta.total
      }, null, _parent));
      _push(`</div></div></div><!--]-->`);
    };
  }
});
const _sfc_setup$z = _sfc_main$z.setup;
_sfc_main$z.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/AnimeIndexPage.vue");
  return _sfc_setup$z ? _sfc_setup$z(props, ctx) : void 0;
};
const __vite_glob_0_9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main$z
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main$y = /* @__PURE__ */ defineComponent({
  ...{ layout: _sfc_main$T },
  __name: "DevelopersPage",
  __ssrInlineRender: true,
  props: {
    apiBaseUrl: {}
  },
  setup(__props) {
    const props = __props;
    const sections = [
      {
        id: "auth",
        title: "Authentication",
        endpoints: [
          {
            id: "issue-token",
            method: "POST",
            path: "/auth/token",
            title: "Issue a token",
            auth: "credentials",
            description: "Exchange an AniTrack email and password for a bearer token. Returns the plain-text token once — store it securely. Subject to the strict auth rate limit (5 requests / minute / IP + email).",
            params: [
              { name: "email", in: "body", type: "string", required: true },
              { name: "password", in: "body", type: "string", required: true },
              { name: "device_name", in: "body", type: "string", required: true, notes: "Shown on your settings page so you can identify the client. Max 120 chars." }
            ],
            example: `curl -X POST {BASE}/auth/token \\
  -H "Content-Type: application/json" \\
  -d '{"email":"you@example.com","password":"…","device_name":"My Integration"}'`
          },
          {
            id: "list-tokens",
            method: "GET",
            path: "/auth/tokens",
            title: "List tokens",
            auth: "bearer",
            description: "List your active API tokens (same data shown in the settings page).",
            example: `curl {BASE}/auth/tokens \\
  -H "Authorization: Bearer YOUR_TOKEN"`
          },
          {
            id: "revoke-current",
            method: "DELETE",
            path: "/auth/token",
            title: "Revoke the current token",
            auth: "bearer",
            description: 'Revoke the token used on this request. Useful for client "sign out" flows.',
            example: `curl -X DELETE {BASE}/auth/token \\
  -H "Authorization: Bearer YOUR_TOKEN"`
          },
          {
            id: "revoke-specific",
            method: "DELETE",
            path: "/auth/tokens/{id}",
            title: "Revoke a specific token",
            auth: "bearer",
            description: "Revoke another token belonging to your account.",
            params: [
              { name: "id", in: "path", type: "integer", required: true }
            ],
            example: `curl -X DELETE {BASE}/auth/tokens/42 \\
  -H "Authorization: Bearer YOUR_TOKEN"`
          }
        ]
      },
      {
        id: "user",
        title: "Current User",
        endpoints: [
          {
            id: "get-me",
            method: "GET",
            path: "/user",
            title: "Fetch the authenticated user",
            auth: "bearer",
            description: "Returns the profile of the user who owns the bearer token.",
            example: `curl {BASE}/user \\
  -H "Authorization: Bearer YOUR_TOKEN"`
          }
        ]
      },
      {
        id: "anime",
        title: "Anime",
        endpoints: [
          {
            id: "search",
            method: "GET",
            path: "/anime/search",
            title: "Search the catalogue",
            auth: "bearer",
            description: "Full-text search across English, Romaji and native titles. Adult titles are excluded.",
            params: [
              { name: "q", in: "query", type: "string", required: true, notes: "2–200 characters" },
              { name: "limit", in: "query", type: "integer", notes: "1–50, default 20" }
            ],
            example: `curl "{BASE}/anime/search?q=naruto&limit=5" \\
  -H "Authorization: Bearer YOUR_TOKEN"`
          },
          {
            id: "anime-by-anilist",
            method: "GET",
            path: "/anime/anilist/{anilistId}",
            title: "Get anime by AniList ID",
            auth: "bearer",
            description: "Primary lookup path when you only have an AniList ID (for example, from an anilist.co page). Returns 404 if AniTrack has not yet synced that anime.",
            params: [
              { name: "anilistId", in: "path", type: "integer", required: true }
            ],
            example: `curl {BASE}/anime/anilist/101922 \\
  -H "Authorization: Bearer YOUR_TOKEN"`
          },
          {
            id: "anime-by-slug",
            method: "GET",
            path: "/anime/{slug}",
            title: "Get anime by slug",
            auth: "bearer",
            description: "Full anime detail with genres, studios and external IDs.",
            params: [
              { name: "slug", in: "path", type: "string", required: true }
            ],
            example: `curl {BASE}/anime/demon-slayer-kimetsu-no-yaiba \\
  -H "Authorization: Bearer YOUR_TOKEN"`
          }
        ]
      },
      {
        id: "list",
        title: "User List",
        endpoints: [
          {
            id: "list-index",
            method: "GET",
            path: "/list",
            title: "Get your list",
            auth: "bearer",
            description: "Returns all list entries belonging to the token owner, most-recently-updated first.",
            params: [
              {
                name: "status",
                in: "query",
                type: "string",
                notes: "One of watching, completed, on_hold, dropped, plan_to_watch"
              }
            ],
            example: `curl "{BASE}/list?status=watching" \\
  -H "Authorization: Bearer YOUR_TOKEN"`
          },
          {
            id: "list-show-anime",
            method: "GET",
            path: "/list/anime/{animeId}",
            title: "Check if an anime is on your list",
            auth: "bearer",
            description: "Returns the list entry for the given anime, or 404 if the user has not added it.",
            params: [
              { name: "animeId", in: "path", type: "integer", required: true }
            ],
            example: `curl {BASE}/list/anime/1234 \\
  -H "Authorization: Bearer YOUR_TOKEN"`
          },
          {
            id: "list-store",
            method: "POST",
            path: "/list",
            title: "Add an anime to your list",
            auth: "bearer",
            description: "Scores are stored on a 0–100 scale. Progress is auto-completed when it reaches the anime's episode count.",
            params: [
              { name: "anime_id", in: "body", type: "integer", required: true },
              { name: "status", in: "body", type: "string", required: true, notes: "watching | completed | on_hold | dropped | plan_to_watch" },
              { name: "score", in: "body", type: "integer", notes: "0–100" },
              { name: "progress", in: "body", type: "integer" },
              { name: "started_at", in: "body", type: "date" },
              { name: "completed_at", in: "body", type: "date" },
              { name: "notes", in: "body", type: "string", notes: "Max 2000 chars" },
              { name: "is_private", in: "body", type: "boolean" }
            ],
            example: `curl -X POST {BASE}/list \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"anime_id":1234,"status":"watching","progress":3}'`
          },
          {
            id: "list-update",
            method: "PATCH",
            path: "/list/{entryId}",
            title: "Update a list entry",
            auth: "bearer",
            description: "Partial update — send only the fields you want to change.",
            params: [
              { name: "entryId", in: "path", type: "integer", required: true },
              { name: "status", in: "body", type: "string" },
              { name: "score", in: "body", type: "integer", notes: "0–100" },
              { name: "progress", in: "body", type: "integer" },
              { name: "is_rewatching", in: "body", type: "boolean" },
              { name: "rewatch_count", in: "body", type: "integer" },
              { name: "tags", in: "body", type: "string[]" }
            ],
            example: `curl -X PATCH {BASE}/list/987 \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"progress":12,"score":85}'`
          },
          {
            id: "list-destroy",
            method: "DELETE",
            path: "/list/{entryId}",
            title: "Remove a list entry",
            auth: "bearer",
            description: "Soft-deletes the entry.",
            params: [
              { name: "entryId", in: "path", type: "integer", required: true }
            ],
            example: `curl -X DELETE {BASE}/list/987 \\
  -H "Authorization: Bearer YOUR_TOKEN"`
          }
        ]
      }
    ];
    const tocSections = computed(() => [
      { id: "overview", title: "Overview" },
      { id: "authentication", title: "Getting a Token" },
      { id: "making-requests", title: "Making Requests" },
      { id: "rate-limits", title: "Rate Limits" },
      { id: "errors", title: "Errors" },
      { id: "versioning", title: "Versioning" },
      ...sections.map((s2) => ({ id: s2.id, title: s2.title }))
    ]);
    function renderExample(ex) {
      return ex.replace(/\{BASE\}/g, props.apiBaseUrl);
    }
    const copiedId = ref(null);
    async function copy(text, id) {
      try {
        await navigator.clipboard.writeText(text);
        copiedId.value = id;
        setTimeout(() => {
          if (copiedId.value === id) copiedId.value = null;
        }, 1500);
      } catch {
      }
    }
    const methodBadge = {
      GET: "bg-emerald-900/50 text-emerald-300 border-emerald-700",
      POST: "bg-sky-900/50 text-sky-300 border-sky-700",
      PATCH: "bg-amber-900/50 text-amber-300 border-amber-700",
      DELETE: "bg-rose-900/50 text-rose-300 border-rose-700"
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Head = resolveComponent("Head");
      const _component_Link = resolveComponent("Link");
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_Head, { title: "Developers" }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<meta name="description" content="AniTrack public API documentation for third-party integrations."${_scopeId}><link rel="canonical"${ssrRenderAttr("href", _ctx.route("developers"))}${_scopeId}>`);
          } else {
            return [
              createVNode("meta", {
                name: "description",
                content: "AniTrack public API documentation for third-party integrations."
              }),
              createVNode("link", {
                rel: "canonical",
                href: _ctx.route("developers")
              }, null, 8, ["href"])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div class="grid grid-cols-1 gap-8 lg:grid-cols-[16rem_1fr]"><aside class="hidden lg:block"><nav class="sticky top-6 space-y-1 text-sm"><p class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500"> On this page </p><!--[-->`);
      ssrRenderList(tocSections.value, (item) => {
        _push(`<a${ssrRenderAttr("href", `#${item.id}`)} class="block rounded px-2 py-1 text-gray-400 transition hover:bg-gray-900 hover:text-gray-100">${ssrInterpolate(item.title)}</a>`);
      });
      _push(`<!--]--></nav></aside><div class="min-w-0 space-y-12"><header><p class="text-sm font-medium text-emerald-400">AniTrack API</p><h1 class="mt-1 text-3xl font-bold">Developers</h1><p class="mt-3 max-w-2xl text-gray-400"> The AniTrack public API lets third-party integrations read and manage your list on your behalf. All endpoints are versioned and served from <code class="rounded bg-gray-900 px-1.5 py-0.5 text-emerald-300">${ssrInterpolate(__props.apiBaseUrl)}</code>. </p></header><section id="overview" class="space-y-3 scroll-mt-6"><h2 class="text-xl font-semibold">Overview</h2><p class="text-gray-400 leading-relaxed"> The API uses JSON request/response bodies, bearer-token authentication, and conventional HTTP status codes. Every authenticated endpoint acts as the token&#39;s owner — there are no &quot;admin&quot; or &quot;impersonation&quot; flows. </p></section><section id="authentication" class="space-y-3 scroll-mt-6"><h2 class="text-xl font-semibold">Getting a Token</h2><p class="text-gray-400 leading-relaxed"> You can mint a token in two ways: </p><ol class="ml-6 list-decimal space-y-2 text-gray-400"><li> From the `);
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("settings"),
        class: "text-emerald-400 hover:underline"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Settings page`);
          } else {
            return [
              createTextVNode("Settings page")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(` → <strong>API Tokens</strong> — recommended for personal integrations. The plain-text token is shown once; copy it immediately. </li><li> By calling <code class="rounded bg-gray-900 px-1.5 py-0.5 text-emerald-300">POST /auth/token</code> with a user&#39;s email + password — suitable for clients that need a sign-in flow. </li></ol><div class="rounded-lg border border-amber-800/50 bg-amber-950/30 p-3 text-sm text-amber-200"> Treat tokens like passwords. Anyone with a token can read and modify that user&#39;s list. Revoke unused tokens from the settings page. </div></section><section id="making-requests" class="space-y-3 scroll-mt-6"><h2 class="text-xl font-semibold">Making Requests</h2><p class="text-gray-400 leading-relaxed"> Pass the token on every request in the <code class="rounded bg-gray-900 px-1.5 py-0.5 text-emerald-300">Authorization</code> header: </p><pre class="overflow-x-auto rounded-lg border border-gray-800 bg-gray-950 p-4 text-sm text-gray-300"><code>Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
Accept: application/json</code></pre><p class="text-gray-400 leading-relaxed"> All dates are ISO-8601 (UTC). Scores are stored on a 0–100 scale; the UI divides by ten for display. </p></section><section id="rate-limits" class="space-y-3 scroll-mt-6"><h2 class="text-xl font-semibold">Rate Limits</h2><p class="text-gray-400 leading-relaxed"> Authenticated endpoints are capped at <strong>60 requests / minute</strong> per token. The token-issuance endpoint is capped at <strong>5 requests / minute</strong> per email and per IP to deter credential stuffing. Exceeding these limits returns <code class="rounded bg-gray-900 px-1.5 py-0.5">429 Too Many Requests</code>. </p></section><section id="errors" class="space-y-3 scroll-mt-6"><h2 class="text-xl font-semibold">Errors</h2><p class="text-gray-400 leading-relaxed"> Errors are returned as JSON with a <code class="rounded bg-gray-900 px-1.5 py-0.5 text-emerald-300">message</code> field and, for validation failures, an <code class="rounded bg-gray-900 px-1.5 py-0.5 text-emerald-300">errors</code> object keyed by field name. </p><pre class="overflow-x-auto rounded-lg border border-gray-800 bg-gray-950 p-4 text-sm text-gray-300"><code>{
  &quot;message&quot;: &quot;The given data was invalid.&quot;,
  &quot;errors&quot;: {
    &quot;status&quot;: [&quot;The status field is required.&quot;]
  }
}</code></pre><p class="text-sm text-gray-500"> Common codes: <code>401</code> missing / invalid token, <code>403</code> feature not enabled for this account, <code>404</code> resource not found, <code>422</code> validation failed, <code>429</code> rate-limited. </p></section><section id="versioning" class="space-y-3 scroll-mt-6"><h2 class="text-xl font-semibold">Versioning</h2><p class="text-gray-400 leading-relaxed"> Endpoints live under <code class="rounded bg-gray-900 px-1.5 py-0.5 text-emerald-300">/api/v1</code>. Breaking changes will ship under a new major version; within <code>v1</code> we will only add fields, never remove or rename them. </p></section><!--[-->`);
      ssrRenderList(sections, (group) => {
        _push(`<section${ssrRenderAttr("id", group.id)} class="space-y-4 scroll-mt-6"><h2 class="text-xl font-semibold">${ssrInterpolate(group.title)}</h2><!--[-->`);
        ssrRenderList(group.endpoints, (endpoint) => {
          _push(`<article${ssrRenderAttr("id", endpoint.id)} class="space-y-3 rounded-xl border border-gray-800 bg-gray-900/40 p-5 scroll-mt-6"><header class="space-y-2"><h3 class="text-base font-semibold text-gray-100">${ssrInterpolate(endpoint.title)}</h3><div class="flex flex-wrap items-center gap-2"><span class="${ssrRenderClass([methodBadge[endpoint.method], "inline-flex items-center rounded border px-2 py-0.5 text-xs font-mono font-semibold"])}">${ssrInterpolate(endpoint.method)}</span><code class="font-mono text-sm text-gray-300">${ssrInterpolate(endpoint.path)}</code>`);
          if (endpoint.auth === "bearer") {
            _push(`<span class="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-400"> Requires bearer token </span>`);
          } else if (endpoint.auth === "credentials") {
            _push(`<span class="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-400"> Requires email + password </span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></header><p class="text-sm text-gray-400 leading-relaxed">${ssrInterpolate(endpoint.description)}</p>`);
          if (endpoint.params && endpoint.params.length > 0) {
            _push(`<div><p class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500"> Parameters </p><table class="w-full text-left text-sm"><thead class="text-xs uppercase text-gray-500"><tr><th class="pb-2 pr-3 font-medium">Name</th><th class="pb-2 pr-3 font-medium">In</th><th class="pb-2 pr-3 font-medium">Type</th><th class="pb-2 font-medium">Notes</th></tr></thead><tbody class="divide-y divide-gray-800"><!--[-->`);
            ssrRenderList(endpoint.params, (p2) => {
              _push(`<tr><td class="py-2 pr-3"><code class="font-mono text-emerald-300">${ssrInterpolate(p2.name)}</code>`);
              if (p2.required) {
                _push(`<span class="ml-1 text-rose-400">*</span>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</td><td class="py-2 pr-3 text-gray-500">${ssrInterpolate(p2.in)}</td><td class="py-2 pr-3 text-gray-400">${ssrInterpolate(p2.type)}</td><td class="py-2 text-gray-500">${ssrInterpolate(p2.notes ?? "")}</td></tr>`);
            });
            _push(`<!--]--></tbody></table></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="relative">`);
          _push(ssrRenderComponent(unref(Button), {
            type: "button",
            size: "small",
            severity: "secondary",
            text: "",
            class: "!absolute !right-2 !top-2 !text-xs",
            label: copiedId.value === endpoint.id ? "Copied" : "Copy",
            onClick: ($event) => copy(renderExample(endpoint.example), endpoint.id)
          }, null, _parent));
          _push(`<pre class="overflow-x-auto rounded-lg border border-gray-800 bg-gray-950 p-4 pr-16 text-sm text-gray-300"><code>${ssrInterpolate(renderExample(endpoint.example))}</code></pre></div></article>`);
        });
        _push(`<!--]--></section>`);
      });
      _push(`<!--]--></div></div><!--]-->`);
    };
  }
});
const _sfc_setup$y = _sfc_main$y.setup;
_sfc_main$y.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/DevelopersPage.vue");
  return _sfc_setup$y ? _sfc_setup$y(props, ctx) : void 0;
};
const __vite_glob_0_10 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main$y
}, Symbol.toStringTag, { value: "Module" }));
function useAnimeSearch() {
  const query = ref("");
  const debouncedQuery = useDebounce(query, 300);
  const enabled = computed(() => debouncedQuery.value.length >= 2);
  const { data, isFetching, isError } = useQuery({
    queryKey: ["anime-search", debouncedQuery],
    queryFn: async ({ signal }) => {
      const { data: data2 } = await axios.get("/api/search", {
        params: { q: debouncedQuery.value },
        signal
      });
      return data2;
    },
    enabled,
    staleTime: 5 * 60 * 1e3
  });
  const results = computed(() => data.value?.data ?? []);
  const total = computed(() => data.value?.total ?? 0);
  return {
    query,
    debouncedQuery,
    results,
    total,
    isLoading: isFetching,
    isError
  };
}
const _sfc_main$x = /* @__PURE__ */ defineComponent({
  __name: "SearchBar",
  __ssrInlineRender: true,
  setup(__props) {
    const { query, results, total, isLoading } = useAnimeSearch();
    const isOpen = ref(false);
    function displayTitle(anime) {
      return anime.title_english || anime.title_romaji;
    }
    function animeUrl(anime) {
      if (anime.slug) {
        return route("anime.show", { anime: anime.slug });
      }
      if (anime.anilist_id) {
        return route("anime.show.anilist", { anilistId: anime.anilist_id });
      }
      return "#";
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Link = resolveComponent("Link");
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "relative" }, _attrs))}><input${ssrRenderAttr("value", unref(query))} type="text" placeholder="Search anime..." class="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500">`);
      if (isOpen.value && unref(query).length >= 2) {
        _push(`<div class="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded-lg border border-gray-700 bg-gray-900 shadow-xl">`);
        if (unref(isLoading)) {
          _push(`<div class="p-4 text-center text-sm text-gray-500"> Searching... </div>`);
        } else if (unref(results).length === 0) {
          _push(`<div class="p-4 text-center text-sm text-gray-500"> No results found </div>`);
        } else {
          _push(`<!--[--><!--[-->`);
          ssrRenderList(unref(results), (anime) => {
            _push(ssrRenderComponent(_component_Link, {
              key: anime.id ?? anime.anilist_id,
              href: animeUrl(anime),
              class: "flex items-center gap-3 px-4 py-2.5 transition hover:bg-gray-800"
            }, {
              default: withCtx((_2, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  if (anime.cover_image_medium) {
                    _push2(`<img${ssrRenderAttr("src", anime.cover_image_medium)}${ssrRenderAttr("alt", displayTitle(anime))} class="h-12 w-8 rounded object-cover"${_scopeId}>`);
                  } else {
                    _push2(`<div class="h-12 w-8 rounded bg-gray-800"${_scopeId}></div>`);
                  }
                  _push2(`<div class="min-w-0 flex-1"${_scopeId}><p class="truncate text-sm text-gray-200"${_scopeId}>${ssrInterpolate(displayTitle(anime))}</p><p class="text-xs text-gray-500"${_scopeId}>`);
                  if (anime.format) {
                    _push2(`<span${_scopeId}>${ssrInterpolate(anime.format.replace(/_/g, " "))}</span>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  if (anime.season_year) {
                    _push2(`<span${_scopeId}> · ${ssrInterpolate(anime.season_year)}</span>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</p></div>`);
                  if (anime.average_score) {
                    _push2(`<span class="text-xs text-gray-400"${_scopeId}>${ssrInterpolate(anime.average_score.toFixed(1))}</span>`);
                  } else {
                    _push2(`<!---->`);
                  }
                } else {
                  return [
                    anime.cover_image_medium ? (openBlock(), createBlock("img", {
                      key: 0,
                      src: anime.cover_image_medium,
                      alt: displayTitle(anime),
                      class: "h-12 w-8 rounded object-cover"
                    }, null, 8, ["src", "alt"])) : (openBlock(), createBlock("div", {
                      key: 1,
                      class: "h-12 w-8 rounded bg-gray-800"
                    })),
                    createVNode("div", { class: "min-w-0 flex-1" }, [
                      createVNode("p", { class: "truncate text-sm text-gray-200" }, toDisplayString(displayTitle(anime)), 1),
                      createVNode("p", { class: "text-xs text-gray-500" }, [
                        anime.format ? (openBlock(), createBlock("span", { key: 0 }, toDisplayString(anime.format.replace(/_/g, " ")), 1)) : createCommentVNode("", true),
                        anime.season_year ? (openBlock(), createBlock("span", { key: 1 }, " · " + toDisplayString(anime.season_year), 1)) : createCommentVNode("", true)
                      ])
                    ]),
                    anime.average_score ? (openBlock(), createBlock("span", {
                      key: 2,
                      class: "text-xs text-gray-400"
                    }, toDisplayString(anime.average_score.toFixed(1)), 1)) : createCommentVNode("", true)
                  ];
                }
              }),
              _: 2
            }, _parent));
          });
          _push(`<!--]-->`);
          if (unref(total) > 5) {
            _push(ssrRenderComponent(_component_Link, {
              href: _ctx.route("anime.index") + "?filter%5Bsearch%5D=" + encodeURIComponent(unref(query)),
              class: "block border-t border-gray-800 px-4 py-2.5 text-center text-sm text-primary-400 transition hover:bg-gray-800"
            }, {
              default: withCtx((_2, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(` View all ${ssrInterpolate(unref(total))} results `);
                } else {
                  return [
                    createTextVNode(" View all " + toDisplayString(unref(total)) + " results ", 1)
                  ];
                }
              }),
              _: 1
            }, _parent));
          } else {
            _push(`<!---->`);
          }
          _push(`<!--]-->`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$x = _sfc_main$x.setup;
_sfc_main$x.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/SearchBar.vue");
  return _sfc_setup$x ? _sfc_setup$x(props, ctx) : void 0;
};
function useDiscoverMood(selectedMood, selectedLength) {
  const enabled = computed(() => selectedMood.value !== null);
  const { data, isFetching, isError } = useQuery({
    queryKey: ["discover-mood", selectedMood, selectedLength],
    queryFn: async ({ signal }) => {
      const slug = selectedMood.value;
      if (!slug) {
        return { slug: "", length: null, data: [] };
      }
      const { data: data2 } = await axios.get(
        `/api/discover/mood/${encodeURIComponent(slug)}`,
        {
          params: selectedLength.value ? { length: selectedLength.value } : void 0,
          signal
        }
      );
      return data2;
    },
    enabled,
    staleTime: 5 * 60 * 1e3
  });
  const results = computed(() => data.value?.data ?? []);
  return {
    results,
    isLoading: isFetching,
    isError
  };
}
const _sfc_main$w = /* @__PURE__ */ defineComponent({
  ...{ layout: _sfc_main$T },
  __name: "DiscoverPage",
  __ssrInlineRender: true,
  props: {
    moods: {},
    trending: {},
    recentlyUpdated: {},
    hiddenGems: {},
    lengths: {},
    moreLikeIt: {},
    pickedForYou: {}
  },
  setup(__props) {
    const selectedMood = ref(null);
    const selectedLength = ref(null);
    const { results: moodResults, isLoading: moodLoading } = useDiscoverMood(
      selectedMood,
      selectedLength
    );
    const activeMood = computed(() => selectedMood.value);
    function displayTitle(anime) {
      return anime.title_english || anime.title_romaji;
    }
    function animeUrl(anime) {
      if (anime.slug) {
        return route("anime.show", { anime: anime.slug });
      }
      if (anime.anilist_id) {
        return route("anime.show.anilist", { anilistId: anime.anilist_id });
      }
      return "#";
    }
    function airedAgo(iso) {
      const diffMs = Date.now() - new Date(iso).getTime();
      if (diffMs < 0) return "just now";
      const minutes = Math.floor(diffMs / 6e4);
      if (minutes < 60) return minutes <= 1 ? "just now" : `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return days === 1 ? "1d ago" : `${days}d ago`;
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Head = resolveComponent("Head");
      const _component_Link = resolveComponent("Link");
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_Head, { title: "Discover" }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<meta name="description" content="AniTrack — discover, track and manage your anime. Find what to watch next by mood, see what&#39;s trending this week, and uncover hidden gems."${_scopeId}><link rel="canonical"${ssrRenderAttr("href", _ctx.route("home"))}${_scopeId}><meta property="og:title" content="AniTrack — Discover, track and manage your anime"${_scopeId}><meta property="og:description" content="Discover, track and manage your anime — all in one place."${_scopeId}><meta property="og:type" content="website"${_scopeId}>`);
          } else {
            return [
              createVNode("meta", {
                name: "description",
                content: "AniTrack — discover, track and manage your anime. Find what to watch next by mood, see what's trending this week, and uncover hidden gems."
              }),
              createVNode("link", {
                rel: "canonical",
                href: _ctx.route("home")
              }, null, 8, ["href"]),
              createVNode("meta", {
                property: "og:title",
                content: "AniTrack — Discover, track and manage your anime"
              }),
              createVNode("meta", {
                property: "og:description",
                content: "Discover, track and manage your anime — all in one place."
              }),
              createVNode("meta", {
                property: "og:type",
                content: "website"
              })
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div class="space-y-20"><section class="pt-6 pb-2 text-center"><h1 class="text-4xl font-bold tracking-tight text-gray-100 sm:text-5xl"> AniTrack </h1><p class="mx-auto mt-3 max-w-xl text-base text-gray-400 sm:text-lg"> Discover, track and manage your anime. </p><div class="mx-auto mt-8 max-w-xl">`);
      _push(ssrRenderComponent(_sfc_main$x, null, null, _parent));
      _push(`</div></section><section><header class="mb-6 border-b border-gray-800 pb-4"><h2 class="text-2xl font-bold text-gray-100">I&#39;m in the mood for…</h2><p class="mt-1 text-sm text-gray-400">Pick a vibe and we&#39;ll find a match.</p></header><div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"><!--[-->`);
      ssrRenderList(__props.moods, (mood) => {
        _push(`<button type="button" class="${ssrRenderClass([[
          activeMood.value === mood.slug ? "border-primary-400 ring-2 ring-primary-400/40" : "border-gray-800 hover:border-gray-700"
        ], "relative overflow-hidden rounded-xl border p-4 text-left transition"])}"><div class="${ssrRenderClass([mood.gradient ?? "from-gray-700/30 to-gray-900/30", "absolute inset-0 bg-gradient-to-br opacity-60"])}"></div><div class="relative"><div class="text-2xl">${ssrInterpolate(mood.emoji)}</div><div class="mt-2 font-semibold text-gray-100">${ssrInterpolate(mood.label)}</div>`);
        if (mood.description) {
          _push(`<div class="mt-1 text-xs text-gray-300/80">${ssrInterpolate(mood.description)}</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></button>`);
      });
      _push(`<!--]--></div><div class="mt-6 flex flex-wrap items-center gap-2"><span class="text-sm text-gray-500">Length:</span><!--[-->`);
      ssrRenderList(__props.lengths, (opt) => {
        _push(`<button type="button" class="${ssrRenderClass([[
          selectedLength.value === opt.value ? "border-primary-400 bg-primary-500/10 text-primary-300" : "border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200"
        ], "rounded-full border px-3 py-1 text-xs transition"])}">${ssrInterpolate(opt.label)}</button>`);
      });
      _push(`<!--]--></div>`);
      if (activeMood.value) {
        _push(`<div class="mt-8">`);
        if (unref(moodLoading)) {
          _push(`<div class="py-12 text-center text-gray-500"> Finding matches… </div>`);
        } else if (unref(moodResults).length) {
          _push(`<div class="flex gap-4 overflow-x-auto pb-4"><!--[-->`);
          ssrRenderList(unref(moodResults), (anime) => {
            _push(`<div class="w-40 shrink-0 sm:w-44">`);
            _push(ssrRenderComponent(_sfc_main$C, {
              anime,
              "view-mode": "grid"
            }, null, _parent));
            _push(`</div>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<div class="py-12 text-center text-gray-500"> No matches for that combination. Try a different length. </div>`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</section>`);
      if (__props.trending.length) {
        _push(`<section><header class="mb-6 border-b border-gray-800 pb-4"><h2 class="text-2xl font-bold text-gray-100">Trending this week</h2><p class="mt-1 text-sm text-gray-400">The top 10 right now.</p></header><div class="flex gap-4 overflow-x-auto pb-4"><!--[-->`);
        ssrRenderList(__props.trending, (anime, index) => {
          _push(ssrRenderComponent(_component_Link, {
            key: anime.id ?? anime.anilist_id,
            href: animeUrl(anime),
            class: "group relative w-40 shrink-0 sm:w-44"
          }, {
            default: withCtx((_2, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<div class="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-800"${_scopeId}>`);
                if (anime.cover_image_large || anime.cover_image_medium) {
                  _push2(`<img${ssrRenderAttr("src", (anime.cover_image_large || anime.cover_image_medium) ?? void 0)}${ssrRenderAttr("alt", displayTitle(anime))} class="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy"${_scopeId}>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`<div class="absolute -bottom-2 -left-2 text-6xl font-black leading-none text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] sm:text-7xl" style="${ssrRenderStyle({ "-webkit-text-stroke": "2px rgb(17 24 39)" })}"${_scopeId}>${ssrInterpolate(index + 1)}</div><div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-right"${_scopeId}>`);
                _push2(ssrRenderComponent(_sfc_main$H, {
                  score: anime.average_score,
                  size: "sm"
                }, null, _parent2, _scopeId));
                _push2(`</div></div><h3 class="mt-1.5 line-clamp-2 text-sm font-medium text-gray-200 transition group-hover:text-primary-400"${_scopeId}>${ssrInterpolate(displayTitle(anime))}</h3>`);
              } else {
                return [
                  createVNode("div", { class: "relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-800" }, [
                    anime.cover_image_large || anime.cover_image_medium ? (openBlock(), createBlock("img", {
                      key: 0,
                      src: (anime.cover_image_large || anime.cover_image_medium) ?? void 0,
                      alt: displayTitle(anime),
                      class: "h-full w-full object-cover transition-transform group-hover:scale-105",
                      loading: "lazy"
                    }, null, 8, ["src", "alt"])) : createCommentVNode("", true),
                    createVNode("div", {
                      class: "absolute -bottom-2 -left-2 text-6xl font-black leading-none text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] sm:text-7xl",
                      style: { "-webkit-text-stroke": "2px rgb(17 24 39)" }
                    }, toDisplayString(index + 1), 1),
                    createVNode("div", { class: "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-right" }, [
                      createVNode(_sfc_main$H, {
                        score: anime.average_score,
                        size: "sm"
                      }, null, 8, ["score"])
                    ])
                  ]),
                  createVNode("h3", { class: "mt-1.5 line-clamp-2 text-sm font-medium text-gray-200 transition group-hover:text-primary-400" }, toDisplayString(displayTitle(anime)), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></div></section>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.recentlyUpdated.length) {
        _push(`<section><header class="mb-6 border-b border-gray-800 pb-4"><h2 class="text-2xl font-bold text-gray-100">Recently updated</h2><p class="mt-1 text-sm text-gray-400">Fresh episodes just dropped.</p></header><div class="flex gap-4 overflow-x-auto pb-4"><!--[-->`);
        ssrRenderList(__props.recentlyUpdated, (item) => {
          _push(ssrRenderComponent(_component_Link, {
            key: item.anime.id ?? item.anime.anilist_id,
            href: animeUrl(item.anime),
            class: "group relative w-40 shrink-0 sm:w-44"
          }, {
            default: withCtx((_2, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<div class="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-800"${_scopeId}>`);
                if (item.anime.cover_image_large || item.anime.cover_image_medium) {
                  _push2(`<img${ssrRenderAttr("src", (item.anime.cover_image_large || item.anime.cover_image_medium) ?? void 0)}${ssrRenderAttr("alt", displayTitle(item.anime))} class="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy"${_scopeId}>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`<div class="absolute left-2 top-2 rounded-md bg-primary-500/90 px-2 py-0.5 text-xs font-semibold text-white shadow"${_scopeId}> Ep ${ssrInterpolate(item.latest_episode)}</div><div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2"${_scopeId}><div class="text-xs font-medium text-gray-300"${_scopeId}>${ssrInterpolate(airedAgo(item.aired_at))}</div></div></div><h3 class="mt-1.5 line-clamp-2 text-sm font-medium text-gray-200 transition group-hover:text-primary-400"${_scopeId}>${ssrInterpolate(displayTitle(item.anime))}</h3>`);
              } else {
                return [
                  createVNode("div", { class: "relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-800" }, [
                    item.anime.cover_image_large || item.anime.cover_image_medium ? (openBlock(), createBlock("img", {
                      key: 0,
                      src: (item.anime.cover_image_large || item.anime.cover_image_medium) ?? void 0,
                      alt: displayTitle(item.anime),
                      class: "h-full w-full object-cover transition-transform group-hover:scale-105",
                      loading: "lazy"
                    }, null, 8, ["src", "alt"])) : createCommentVNode("", true),
                    createVNode("div", { class: "absolute left-2 top-2 rounded-md bg-primary-500/90 px-2 py-0.5 text-xs font-semibold text-white shadow" }, " Ep " + toDisplayString(item.latest_episode), 1),
                    createVNode("div", { class: "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2" }, [
                      createVNode("div", { class: "text-xs font-medium text-gray-300" }, toDisplayString(airedAgo(item.aired_at)), 1)
                    ])
                  ]),
                  createVNode("h3", { class: "mt-1.5 line-clamp-2 text-sm font-medium text-gray-200 transition group-hover:text-primary-400" }, toDisplayString(displayTitle(item.anime)), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></div></section>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.moreLikeIt) {
        _push(`<section><header class="mb-6 border-b border-gray-800 pb-4"><h2 class="text-2xl font-bold text-gray-100">More like it</h2><p class="mt-1 text-sm text-gray-400"> Because you liked `);
        _push(ssrRenderComponent(_component_Link, {
          href: animeUrl(__props.moreLikeIt.anchor),
          class: "font-medium text-primary-400 hover:text-primary-300"
        }, {
          default: withCtx((_2, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(displayTitle(__props.moreLikeIt.anchor))}`);
            } else {
              return [
                createTextVNode(toDisplayString(displayTitle(__props.moreLikeIt.anchor)), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</p></header><div class="flex gap-4 overflow-x-auto pb-4"><!--[-->`);
        ssrRenderList(__props.moreLikeIt.similar, (anime) => {
          _push(`<div class="w-40 shrink-0 sm:w-44">`);
          _push(ssrRenderComponent(_sfc_main$C, {
            anime,
            "view-mode": "grid"
          }, null, _parent));
          _push(`</div>`);
        });
        _push(`<!--]--></div></section>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.pickedForYou && __props.pickedForYou.items.length) {
        _push(`<section><header class="mb-6 border-b border-gray-800 pb-4"><h2 class="text-2xl font-bold text-gray-100">Picked for you</h2><p class="mt-1 text-sm text-gray-400">Tuned to the titles you&#39;ve rated.</p></header><div class="flex gap-4 overflow-x-auto pb-4"><!--[-->`);
        ssrRenderList(__props.pickedForYou.items, (anime) => {
          _push(`<div class="w-40 shrink-0 sm:w-44">`);
          _push(ssrRenderComponent(_sfc_main$C, {
            anime,
            "view-mode": "grid"
          }, null, _parent));
          _push(`</div>`);
        });
        _push(`<!--]--></div></section>`);
      } else if (__props.pickedForYou) {
        _push(`<section><header class="mb-6 border-b border-gray-800 pb-4"><h2 class="text-2xl font-bold text-gray-100">Picked for you</h2></header><div class="rounded-xl border border-dashed border-gray-700 bg-gray-900/40 p-8 text-center"><p class="text-gray-300">Rate a few titles you&#39;ve enjoyed and we&#39;ll tune recommendations to your taste.</p></div></section>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.hiddenGems.length) {
        _push(`<section><header class="mb-6 border-b border-gray-800 pb-4"><h2 class="text-2xl font-bold text-gray-100">Hidden gems</h2><p class="mt-1 text-sm text-gray-400">Highly rated, rarely watched.</p></header><div class="flex gap-4 overflow-x-auto pb-4"><!--[-->`);
        ssrRenderList(__props.hiddenGems, (anime) => {
          _push(`<div class="w-40 shrink-0 sm:w-44">`);
          _push(ssrRenderComponent(_sfc_main$C, {
            anime,
            "view-mode": "grid"
          }, null, _parent));
          _push(`</div>`);
        });
        _push(`<!--]--></div></section>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><!--]-->`);
    };
  }
});
const _sfc_setup$w = _sfc_main$w.setup;
_sfc_main$w.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/DiscoverPage.vue");
  return _sfc_setup$w ? _sfc_setup$w(props, ctx) : void 0;
};
const __vite_glob_0_11 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main$w
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main$v = /* @__PURE__ */ defineComponent({
  ...{ layout: false },
  __name: "ErrorPage",
  __ssrInlineRender: true,
  props: {
    status: {}
  },
  setup(__props) {
    const titles = {
      403: "Forbidden",
      404: "Not Found",
      419: "Session Expired",
      500: "Server Error",
      503: "Service Unavailable"
    };
    const descriptions = {
      403: "You don't have permission to access this page.",
      404: "The page you're looking for doesn't exist.",
      419: "Your session has expired. Please refresh the page and try again.",
      500: "Something went wrong on our end. Please try again later.",
      503: "We're currently undergoing maintenance. Please check back soon."
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Head = resolveComponent("Head");
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_Head, {
        title: `${__props.status} - ${titles[__props.status] ?? "Error"}`
      }, null, _parent));
      _push(`<div class="flex min-h-screen items-center justify-center bg-gray-950 text-center dark"><div><h1 class="text-6xl font-bold text-gray-700">${ssrInterpolate(__props.status)}</h1><p class="text-xl font-medium text-gray-400 mt-2">${ssrInterpolate(titles[__props.status] ?? "Error")}</p><p class="text-gray-500 mt-4">${ssrInterpolate(descriptions[__props.status] ?? "An unexpected error occurred.")}</p><a href="/" class="text-primary-400 hover:text-primary-300 mt-6 inline-block transition"> Go Home </a></div></div><!--]-->`);
    };
  }
});
const _sfc_setup$v = _sfc_main$v.setup;
_sfc_main$v.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/ErrorPage.vue");
  return _sfc_setup$v ? _sfc_setup$v(props, ctx) : void 0;
};
const __vite_glob_0_12 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main$v
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main$u = /* @__PURE__ */ defineComponent({
  __name: "ImportWizard",
  __ssrInlineRender: true,
  setup(__props) {
    const step = ref("upload");
    const preview = ref([]);
    const token = ref("");
    const total = ref(0);
    const progress = ref(0);
    const fetching = ref(false);
    const result = ref(null);
    const overwrite = ref(false);
    const uploading = ref(false);
    const confirming = ref(false);
    const error = ref("");
    const showNotFound = ref(false);
    let pollTimer = null;
    async function confirmImport() {
      confirming.value = true;
      error.value = "";
      try {
        const { data } = await axios.post(
          route("import.confirm"),
          { token: token.value, overwrite_existing: overwrite.value }
        );
        if (data.status === "done") {
          result.value = data.result ?? null;
          step.value = "done";
        } else {
          step.value = "processing";
          startPolling();
        }
      } catch (e2) {
        if (axios.isAxiosError(e2)) {
          error.value = e2.response?.data?.error ?? "Import failed";
        } else {
          error.value = "Import failed";
        }
      } finally {
        confirming.value = false;
      }
    }
    function startPolling() {
      pollTimer = setInterval(async () => {
        try {
          const { data } = await axios.get(route("import.status"), {
            params: { token: token.value }
          });
          progress.value = data.processed;
          fetching.value = data.status === "fetching";
          if (data.status === "done") {
            result.value = data.result ?? null;
            step.value = "done";
            stopPolling();
          } else if (data.status === "failed") {
            error.value = "Import failed during processing";
            step.value = "upload";
            stopPolling();
          }
        } catch {
          error.value = "Failed to check import status";
          stopPolling();
        }
      }, 2e3);
    }
    function stopPolling() {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    }
    onUnmounted(stopPolling);
    function reset() {
      step.value = "upload";
      preview.value = [];
      token.value = "";
      total.value = 0;
      progress.value = 0;
      fetching.value = false;
      result.value = null;
      error.value = "";
      showNotFound.value = false;
      overwrite.value = false;
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Link = resolveComponent("Link");
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "max-w-2xl mx-auto" }, _attrs))}>`);
      if (error.value) {
        _push(`<div class="mb-4 rounded-lg border border-red-800 bg-red-900/30 px-4 py-3 text-red-300 text-sm">${ssrInterpolate(error.value)}</div>`);
      } else {
        _push(`<!---->`);
      }
      if (step.value === "upload") {
        _push(`<div class="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center"><h2 class="text-lg font-semibold mb-2">Import from MyAnimeList</h2><p class="text-gray-400 text-sm mb-6"> Upload your MAL XML export file. You can export your list from MyAnimeList under Settings → Import/Export. </p><label class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-600 px-8 py-6 hover:border-gray-500 transition"><input type="file" accept=".xml,.gz,.xml.gz" class="hidden"><span class="text-gray-300">${ssrInterpolate(uploading.value ? "Parsing..." : "Choose XML file")}</span></label></div>`);
      } else if (step.value === "preview") {
        _push(`<div class="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4"><h2 class="text-lg font-semibold">Preview — ${ssrInterpolate(total.value)} entries found</h2><div class="max-h-64 overflow-y-auto"><table class="w-full text-sm"><thead><tr class="text-left text-gray-400 border-b border-gray-800"><th class="py-2 pr-4">Title</th><th class="py-2 pr-4">Status</th><th class="py-2 pr-4">Score</th><th class="py-2">Progress</th></tr></thead><tbody><!--[-->`);
        ssrRenderList(preview.value, (entry, i2) => {
          _push(`<tr class="border-b border-gray-800/50"><td class="py-1.5 pr-4 text-gray-300">${ssrInterpolate(entry.title)}</td><td class="py-1.5 pr-4 text-gray-400">${ssrInterpolate(entry.status)}</td><td class="py-1.5 pr-4 text-gray-400">${ssrInterpolate(entry.score > 0 ? entry.score : "-")}</td><td class="py-1.5 text-gray-400">${ssrInterpolate(entry.progress)}</td></tr>`);
        });
        _push(`<!--]--></tbody></table></div>`);
        if (total.value > 20) {
          _push(`<p class="text-xs text-gray-500"> Showing first 20 of ${ssrInterpolate(total.value)} entries. </p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<label class="flex items-center gap-2 text-sm text-gray-300"><input${ssrIncludeBooleanAttr(Array.isArray(overwrite.value) ? ssrLooseContain(overwrite.value, null) : overwrite.value) ? " checked" : ""} type="checkbox" class="rounded border-gray-600"> Overwrite existing entries </label><div class="flex gap-2">`);
        _push(ssrRenderComponent(unref(Button), {
          label: "Cancel",
          severity: "secondary",
          text: "",
          onClick: reset
        }, null, _parent));
        _push(ssrRenderComponent(unref(Button), {
          label: `Import ${total.value} entries`,
          loading: confirming.value,
          onClick: confirmImport
        }, null, _parent));
        _push(`</div></div>`);
      } else if (step.value === "processing") {
        _push(`<div class="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center space-y-4"><h2 class="text-lg font-semibold">${ssrInterpolate(fetching.value ? "Fetching missing anime..." : "Importing...")}</h2>`);
        if (!fetching.value) {
          _push(ssrRenderComponent(unref(ProgressBar), {
            value: total.value > 0 ? Math.round(progress.value / total.value * 100) : 0
          }, null, _parent));
        } else {
          _push(ssrRenderComponent(unref(ProgressBar), { mode: "indeterminate" }, null, _parent));
        }
        _push(`<p class="text-sm text-gray-400">${ssrInterpolate(fetching.value ? "Looking up anime not yet in our database" : `${progress.value} / ${total.value} entries processed`)}</p></div>`);
      } else if (step.value === "done" && result.value) {
        _push(`<div class="bg-gray-900 border border-gray-800 rounded-xl p-8 space-y-4"><h2 class="text-lg font-semibold text-green-400">Import Complete</h2><div class="grid grid-cols-2 gap-4 sm:grid-cols-4"><div class="rounded-lg bg-gray-800 p-4 text-center"><div class="text-2xl font-bold text-primary-400">${ssrInterpolate(result.value.imported)}</div><div class="text-xs text-gray-400">Imported</div></div><div class="rounded-lg bg-gray-800 p-4 text-center"><div class="text-2xl font-bold text-gray-300">${ssrInterpolate(result.value.skipped)}</div><div class="text-xs text-gray-400">Skipped</div></div><div class="rounded-lg bg-gray-800 p-4 text-center"><div class="text-2xl font-bold text-red-400">${ssrInterpolate(result.value.errors)}</div><div class="text-xs text-gray-400">Not Found</div></div><div class="rounded-lg bg-gray-800 p-4 text-center"><div class="text-2xl font-bold text-gray-300">${ssrInterpolate(result.value.total)}</div><div class="text-xs text-gray-400">Total</div></div></div>`);
        if (result.value.not_found && result.value.not_found.length > 0) {
          _push(`<div><button class="text-sm text-gray-400 hover:text-gray-200 transition flex items-center gap-1"><span>${ssrInterpolate(showNotFound.value ? "▾" : "▸")}</span> ${ssrInterpolate(result.value.not_found.length)} anime could not be found </button>`);
          if (showNotFound.value) {
            _push(`<div class="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-800 bg-gray-800/50"><table class="w-full text-sm"><thead><tr class="text-left text-gray-500 border-b border-gray-700"><th class="px-3 py-1.5">Title</th><th class="px-3 py-1.5 w-24">MAL ID</th></tr></thead><tbody><!--[-->`);
            ssrRenderList(result.value.not_found, (entry) => {
              _push(`<tr class="border-b border-gray-800/50"><td class="px-3 py-1.5 text-gray-300">${ssrInterpolate(entry.title)}</td><td class="px-3 py-1.5"><a${ssrRenderAttr("href", `https://myanimelist.net/anime/${entry.mal_id}`)} target="_blank" rel="noopener" class="text-primary-400 hover:text-primary-300 transition">${ssrInterpolate(entry.mal_id)}</a></td></tr>`);
            });
            _push(`<!--]--></tbody></table></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="flex gap-2">`);
        _push(ssrRenderComponent(_component_Link, {
          href: _ctx.route("list")
        }, {
          default: withCtx((_2, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(unref(Button), { label: "Go to My List" }, null, _parent2, _scopeId));
            } else {
              return [
                createVNode(unref(Button), { label: "Go to My List" })
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(unref(Button), {
          label: "Import Another",
          severity: "secondary",
          text: "",
          onClick: reset
        }, null, _parent));
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$u = _sfc_main$u.setup;
_sfc_main$u.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/ImportWizard.vue");
  return _sfc_setup$u ? _sfc_setup$u(props, ctx) : void 0;
};
const _sfc_main$t = /* @__PURE__ */ defineComponent({
  ...{ layout: _sfc_main$T },
  __name: "ImportPage",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Head = resolveComponent("Head");
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_Head, { title: "Import from MAL" }, null, _parent));
      _push(`<div><h1 class="text-2xl font-bold mb-6">Import from MAL</h1>`);
      _push(ssrRenderComponent(_sfc_main$u, null, null, _parent));
      _push(`</div><!--]-->`);
    };
  }
});
const _sfc_setup$t = _sfc_main$t.setup;
_sfc_main$t.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/ImportPage.vue");
  return _sfc_setup$t ? _sfc_setup$t(props, ctx) : void 0;
};
const __vite_glob_0_13 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main$t
}, Symbol.toStringTag, { value: "Module" }));
function isSupported() {
  return browserSupportsWebAuthn();
}
function isNotSupported() {
  return !isSupported();
}
function isUnsupported() {
  return !isSupported();
}
async function isAutofillable() {
  return isSupported() && await browserSupportsWebAuthnAutofill();
}
async function isNotAutofillable() {
  return !await isAutofillable();
}
async function isPlatformAuthenticator() {
  return isSupported() && await platformAuthenticatorIsAvailable();
}
async function isNotPlatformAuthenticator() {
  return !await isPlatformAuthenticator();
}
function pull(object, key) {
  const extracted = object[key];
  delete object[key];
  return extracted;
}
function isObjectEmpty(value) {
  return typeof value === "object" && !Object.keys(value).length;
}
function mergeDeep(target, source) {
  if (!isObject(target)) {
    return mergeDeep({}, source);
  }
  const output = Object.assign({}, target);
  if (isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = mergeDeep(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}
function isObject(obj) {
  return obj !== null && !Array.isArray(obj) && typeof obj === "object" && typeof obj !== "function";
}
function normalizeOptions(options, config, defaultPathKey) {
  if (!options) {
    options = config.routes[defaultPathKey];
  }
  if (typeof options === "string") {
    options = { path: options };
  }
  options.path = options.path || config.routes[defaultPathKey];
  options.baseURL = options.baseURL || config.baseURL || window.location.origin;
  options.body = options.body || {};
  options.method = options.method || config.method;
  options.headers = options.headers || config.headers;
  options.redirect = options.redirect || config.redirect;
  options.credentials = options.credentials || config.credentials;
  return options;
}
const defaultConfig = {
  method: "post",
  redirect: "error",
  baseURL: void 0,
  findCsrfToken: false,
  findXsrfToken: false,
  useAutofill: void 0,
  routes: {
    attestOptions: "/auth/attest-options",
    attest: "/auth/attest",
    assertOptions: "/auth/assert-options",
    assert: "/auth/assert"
  },
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest"
  },
  credentials: "same-origin"
};
function findTokenInCookie() {
  const match = document.cookie.match(
    new RegExp("(^|;\\s*)([CX]SRF-TOKEN)=([^;]*)", "i")
  );
  return match ? decodeURIComponent(match[3]) : void 0;
}
function findTokenInMeta() {
  return Array.from(document.head.getElementsByTagName("meta")).find((element) => element.name.toLowerCase() === "csrf-token" && !!element.content)?.content;
}
function findTokenInInput() {
  return Array.from(document.body.getElementsByTagName("input")).find((input) => {
    return input.name.toLowerCase() === "_token" && input.type.toLowerCase() === "hidden" && !!input.value;
  })?.value;
}
function isCsrfToken(token) {
  if (token.length < 40) {
    const error = new Error("The token must be an CSRF (40 characters) or XSRF token.");
    error.name = "InvalidToken";
    throw error;
  }
  return token.length === 40;
}
function missingToken(headers) {
  return !Object.keys(headers).find((key) => {
    return ["x-csrf-token", "x-xsrf-token"].includes(key.toLowerCase()) && !!headers[key];
  });
}
function pullTokenConfig(options) {
  return pull(options, "findCsrfToken") || pull(options, "findXsrfToken");
}
function setToken(token, headers) {
  if (token === true && missingToken(headers)) {
    token = findTokenInMeta() ?? findTokenInInput() ?? findTokenInCookie() ?? "";
  }
  if (typeof token === "string") {
    headers[isCsrfToken(token) ? "X-CSRF-TOKEN" : "X-XSRF-TOKEN"] = token;
  }
}
const wfetch = async (options, webAuthnData = {}) => {
  const { path, ...fetchOptions } = options;
  fetchOptions.headers = fetchOptions.headers || {};
  setToken(pullTokenConfig(options), fetchOptions.headers);
  fetchOptions.body = mergeDeep(fetchOptions.body ?? {}, webAuthnData);
  return await ofetch(path, fetchOptions);
};
const benchmark = () => {
  const start = /* @__PURE__ */ new Date();
  return {
    start,
    stop: () => {
      const diffInMs = (/* @__PURE__ */ new Date()).getTime() - start.getTime();
      const minutes = Math.floor(diffInMs / 6e4);
      const seconds = Number((diffInMs % 6e4 / 1e3).toFixed(0));
      return (minutes ? minutes + " minutes, " : "") + (seconds ? seconds + " seconds." : "");
    }
  };
};
function newError(name, message, cause = void 0) {
  const error = new Error(message);
  error.name = name;
  error.cause = cause;
  return error;
}
function webpass(config = {}) {
  const currentConfig = mergeDeep(structuredClone(defaultConfig), config);
  async function attest(options, response) {
    const result = {
      data: void 0,
      credentials: void 0,
      id: void 0,
      success: false,
      error: void 0
    };
    try {
      result.data = result.credentials = await attestRaw(options, response);
    } catch (error) {
      return { ...result, error };
    } finally {
      if (typeof result.data === "object") {
        result.id = result.data?.id || result.data?.uuid || void 0;
      }
      result.success = result.error === void 0;
    }
    return result;
  }
  async function attestRaw(options, response) {
    const bench = benchmark();
    const normalizedOptions = normalizeOptions(options, currentConfig, "attestOptions");
    const normalizedResponseOptions = normalizeOptions(response, currentConfig, "attest");
    console.debug("Attestation Options Sending", normalizedOptions);
    const attestationOptions = await wfetch(normalizedOptions);
    console.debug("Attestation Options Received", attestationOptions);
    if (!attestationOptions || isObjectEmpty(attestationOptions)) {
      throw newError("InvalidAttestationResponse", "The server responded with invalid or empty credential creation options.");
    }
    let credentials;
    try {
      credentials = await startRegistration(attestationOptions);
    } catch (cause) {
      throw newError("AttestationCancelled", "The credentials creation was not completed.", cause);
    }
    console.debug("Attestation Credentials Created", credentials);
    console.debug("Attestation Response Sending", normalizedResponseOptions);
    const result = await wfetch(normalizedResponseOptions, credentials);
    console.debug("Attestation Response Received", result);
    console.debug("Attestation benchmark", bench.stop());
    return result;
  }
  async function assert(options, response) {
    const result = {
      data: void 0,
      user: void 0,
      token: void 0,
      success: false,
      error: void 0
    };
    try {
      result.data = await assertRaw(options, response);
    } catch (error) {
      return { ...result, error };
    } finally {
      if (typeof result.data === "object") {
        result.user = typeof result.data.user === "object" ? result.data.user : result.data;
        result.token = result.data?.token || result.data?.jwt;
        if (!result.token && typeof result.user === "object") {
          result.token = result.user?.token || result.user?.jwt;
        }
      } else if (typeof result.data === "string") {
        result.token = result.data;
      }
      result.success = result.error === void 0;
    }
    return result;
  }
  async function assertRaw(options, response) {
    const bench = benchmark();
    const normalizedOptions = normalizeOptions(options, currentConfig, "assertOptions");
    const normalizedResponseOptions = normalizeOptions(response, currentConfig, "assert");
    console.debug("Assertion Options Sending", normalizedOptions);
    const assertionOptions = await wfetch(normalizedOptions);
    console.debug("Assertion Options Received", assertionOptions);
    if (!assertionOptions || isObjectEmpty(assertionOptions)) {
      throw newError("InvalidAssertionResponse", "The server responded with invalid or empty credential request options.");
    }
    let credentials;
    try {
      credentials = await startAuthentication(
        assertionOptions,
        normalizedOptions.useAutofill ?? normalizedResponseOptions.useAutofill ?? currentConfig.useAutofill
      );
    } catch (cause) {
      throw newError("AssertionCancelled", "The credentials request was not completed.", cause);
    }
    console.debug("Assertion Credentials Retrieved", credentials);
    console.debug("Assertion Response Sending", normalizedResponseOptions);
    const result = await wfetch(normalizedResponseOptions, credentials);
    console.debug("Assertion Response Received", result);
    console.debug("Assertion benchmark", bench.stop());
    return result;
  }
  return {
    assert,
    attest,
    assertRaw,
    attestRaw
  };
}
const Webpass = {
  create: webpass,
  attest: async (options, response) => await webpass().attest(options, response),
  assert: async (options, response) => await webpass().assert(options, response),
  attestRaw: async (options, response) => await webpass().attestRaw(options, response),
  assertRaw: async (options, response) => await webpass().assertRaw(options, response),
  isSupported,
  isNotSupported,
  isUnsupported,
  isAutofillable,
  isNotAutofillable,
  isPlatformAuthenticator,
  isNotPlatformAuthenticator
};
Webpass.create({ findXsrfToken: true });
const _sfc_main$s = /* @__PURE__ */ defineComponent({
  ...{ layout: _sfc_main$T },
  __name: "LoginPage",
  __ssrInlineRender: true,
  setup(__props) {
    const form = useForm({
      email: "",
      password: ""
    });
    const passkeySupported = ref(false);
    const passkeyError = ref(null);
    const passkeyBusy = ref(false);
    onMounted(() => {
      passkeySupported.value = Webpass.isSupported();
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Head = resolveComponent("Head");
      const _component_Link = resolveComponent("Link");
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_Head, { title: "Login" }, null, _parent));
      _push(`<div class="max-w-md mx-auto mt-16"><h1 class="text-2xl font-bold mb-6">Login</h1><form class="space-y-4"><div><label for="email" class="block text-sm text-gray-400 mb-1">Email</label><input id="email"${ssrRenderAttr("value", unref(form).email)} type="email" class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:border-primary-500 focus:outline-none" required autofocus>`);
      if (unref(form).errors.email) {
        _push(`<p class="text-red-400 text-sm mt-1">${ssrInterpolate(unref(form).errors.email)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div><label for="password" class="block text-sm text-gray-400 mb-1">Password</label><input id="password"${ssrRenderAttr("value", unref(form).password)} type="password" class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:border-primary-500 focus:outline-none" required>`);
      if (unref(form).errors.password) {
        _push(`<p class="text-red-400 text-sm mt-1">${ssrInterpolate(unref(form).errors.password)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><button type="submit"${ssrIncludeBooleanAttr(unref(form).processing) ? " disabled" : ""} class="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg transition disabled:opacity-50"> Login </button></form>`);
      if (passkeySupported.value) {
        _push(`<!--[--><div class="flex items-center gap-3 my-6"><span class="flex-1 h-px bg-gray-800"></span><span class="text-xs text-gray-500 uppercase tracking-wider">or</span><span class="flex-1 h-px bg-gray-800"></span></div><button type="button"${ssrIncludeBooleanAttr(passkeyBusy.value) ? " disabled" : ""} class="w-full flex items-center justify-center gap-2 border border-gray-700 hover:bg-gray-900 text-gray-100 py-2 rounded-lg transition disabled:opacity-50"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M15 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"></path><path d="m13 11 8 8-2 2-1-1-1 1-1-1-1 1-1-1-1 1-2-2v-3l2-5Z"></path></svg>`);
        if (passkeyBusy.value) {
          _push(`<span>Waiting for passkey…</span>`);
        } else {
          _push(`<span>Sign in with a passkey</span>`);
        }
        _push(`</button>`);
        if (passkeyError.value) {
          _push(`<p class="text-red-400 text-sm mt-2 text-center">${ssrInterpolate(passkeyError.value)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--]-->`);
      } else {
        _push(`<!---->`);
      }
      _push(`<p class="text-gray-500 text-sm mt-6 text-center"> Don&#39;t have an account? `);
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("register"),
        class: "text-primary-400 hover:text-primary-300"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Sign up`);
          } else {
            return [
              createTextVNode("Sign up")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</p></div><!--]-->`);
    };
  }
});
const _sfc_setup$s = _sfc_main$s.setup;
_sfc_main$s.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/LoginPage.vue");
  return _sfc_setup$s ? _sfc_setup$s(props, ctx) : void 0;
};
const __vite_glob_0_14 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main$s
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main$r = /* @__PURE__ */ defineComponent({
  __name: "LibraryCardsView",
  __ssrInlineRender: true,
  props: {
    entries: {}
  },
  emits: ["edit", "progress"],
  setup(__props, { emit: __emit }) {
    function displayTitle(entry) {
      return entry.anime?.title_english || entry.anime?.title_romaji || "Unknown";
    }
    function canIncrement(entry) {
      const total = entry.anime?.episodes;
      return total == null || entry.progress < total;
    }
    function progressPercent(entry) {
      const total = entry.anime?.episodes;
      if (!total) return 0;
      return Math.min(100, Math.max(0, entry.progress / total * 100));
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Link = resolveComponent("Link");
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" }, _attrs))}><!--[-->`);
      ssrRenderList(__props.entries, (e2) => {
        _push(`<div class="group">`);
        if (e2.anime) {
          _push(ssrRenderComponent(_component_Link, {
            href: e2.anime.slug ? _ctx.route("anime.show", { anime: e2.anime.slug }) : "#",
            class: "relative block aspect-[2/3] overflow-hidden rounded-lg bg-gray-800 shadow-sm",
            style: { backgroundColor: e2.anime.cover_image_color || void 0 }
          }, {
            default: withCtx((_2, _push2, _parent2, _scopeId) => {
              if (_push2) {
                if (e2.anime.cover_image_large || e2.anime.cover_image_medium) {
                  _push2(`<img${ssrRenderAttr("src", e2.anime.cover_image_large || e2.anime.cover_image_medium)}${ssrRenderAttr("alt", displayTitle(e2))} loading="lazy" class="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"${_scopeId}>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`<div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"${_scopeId}></div><div class="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur"${_scopeId}><span class="${ssrRenderClass([unref(statusDotClass)(e2.status), "h-1.5 w-1.5 rounded-full"])}"${_scopeId}></span> ${ssrInterpolate(unref(LIST_STATUS_LABELS)[e2.status])}</div>`);
                if (e2.display_score) {
                  _push2(`<div class="absolute right-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur"${_scopeId}> ★ ${ssrInterpolate(e2.display_score)}</div>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`<div class="absolute inset-x-2.5 bottom-2.5 text-white"${_scopeId}><p class="mb-1.5 line-clamp-2 text-sm font-medium leading-tight drop-shadow"${_scopeId}>${ssrInterpolate(displayTitle(e2))}</p><div class="flex items-center gap-1.5 text-[10px] opacity-90"${_scopeId}><span class="font-mono"${_scopeId}>${ssrInterpolate(e2.progress)}/${ssrInterpolate(e2.anime?.episodes ?? "?")}</span><div class="h-0.5 flex-1 overflow-hidden rounded-full bg-white/20"${_scopeId}><div class="h-full bg-white" style="${ssrRenderStyle({ width: `${progressPercent(e2)}%` })}"${_scopeId}></div></div></div></div>`);
              } else {
                return [
                  e2.anime.cover_image_large || e2.anime.cover_image_medium ? (openBlock(), createBlock("img", {
                    key: 0,
                    src: e2.anime.cover_image_large || e2.anime.cover_image_medium,
                    alt: displayTitle(e2),
                    loading: "lazy",
                    class: "h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                  }, null, 8, ["src", "alt"])) : createCommentVNode("", true),
                  createVNode("div", { class: "absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" }),
                  createVNode("div", { class: "absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur" }, [
                    createVNode("span", {
                      class: ["h-1.5 w-1.5 rounded-full", unref(statusDotClass)(e2.status)]
                    }, null, 2),
                    createTextVNode(" " + toDisplayString(unref(LIST_STATUS_LABELS)[e2.status]), 1)
                  ]),
                  e2.display_score ? (openBlock(), createBlock("div", {
                    key: 1,
                    class: "absolute right-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur"
                  }, " ★ " + toDisplayString(e2.display_score), 1)) : createCommentVNode("", true),
                  createVNode("div", { class: "absolute inset-x-2.5 bottom-2.5 text-white" }, [
                    createVNode("p", { class: "mb-1.5 line-clamp-2 text-sm font-medium leading-tight drop-shadow" }, toDisplayString(displayTitle(e2)), 1),
                    createVNode("div", { class: "flex items-center gap-1.5 text-[10px] opacity-90" }, [
                      createVNode("span", { class: "font-mono" }, toDisplayString(e2.progress) + "/" + toDisplayString(e2.anime?.episodes ?? "?"), 1),
                      createVNode("div", { class: "h-0.5 flex-1 overflow-hidden rounded-full bg-white/20" }, [
                        createVNode("div", {
                          class: "h-full bg-white",
                          style: { width: `${progressPercent(e2)}%` }
                        }, null, 4)
                      ])
                    ])
                  ])
                ];
              }
            }),
            _: 2
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="mt-2 flex items-center gap-1"><button class="flex flex-1 items-center justify-center gap-1 rounded-md border border-gray-700 bg-gray-800 px-2 py-1 text-[11px] font-medium transition hover:border-primary-400 hover:text-primary-400 disabled:cursor-default disabled:text-gray-500 disabled:hover:border-gray-700 disabled:hover:text-gray-500"${ssrIncludeBooleanAttr(!canIncrement(e2)) ? " disabled" : ""}${ssrRenderAttr("title", canIncrement(e2) ? "Add one episode" : "Already at total episode count")}><svg viewBox="0 0 20 20" fill="currentColor" class="h-3 w-3"><path d="M10 3a1 1 0 011 1v5h5a1 1 0 010 2h-5v5a1 1 0 01-2 0v-5H4a1 1 0 010-2h5V4a1 1 0 011-1z"></path></svg> EP ${ssrInterpolate(e2.progress + 1)}</button><button class="rounded-md border border-gray-700 bg-gray-800 px-2 py-1 text-gray-400 transition hover:border-gray-600 hover:text-gray-200" title="Edit entry"><svg viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5"><circle cx="4" cy="10" r="1.5"></circle><circle cx="10" cy="10" r="1.5"></circle><circle cx="16" cy="10" r="1.5"></circle></svg></button></div></div>`);
      });
      _push(`<!--]--></div>`);
    };
  }
});
const _sfc_setup$r = _sfc_main$r.setup;
_sfc_main$r.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/LibraryCardsView.vue");
  return _sfc_setup$r ? _sfc_setup$r(props, ctx) : void 0;
};
const _sfc_main$q = /* @__PURE__ */ defineComponent({
  __name: "LibraryRowsView",
  __ssrInlineRender: true,
  props: {
    entries: {}
  },
  emits: ["edit", "progress"],
  setup(__props, { emit: __emit }) {
    function displayTitle(entry) {
      return entry.anime?.title_english || entry.anime?.title_romaji || "Unknown";
    }
    function canIncrement(entry) {
      const total = entry.anime?.episodes;
      return total == null || entry.progress < total;
    }
    function progressPercent(entry) {
      const total = entry.anime?.episodes;
      if (!total) return 0;
      return Math.min(100, Math.max(0, entry.progress / total * 100));
    }
    function seasonLabel(entry) {
      const year = entry.anime?.season_year;
      const season = entry.anime?.season;
      if (!year && !season) return "—";
      const s2 = season ? season.charAt(0) + season.slice(1).toLowerCase() : "";
      return [year, s2].filter(Boolean).join(" ");
    }
    function genrePair(entry) {
      return (entry.anime?.genres ?? []).slice(0, 2).map((g2) => g2.name).join(" / ");
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Link = resolveComponent("Link");
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "overflow-hidden rounded-lg border border-gray-800 bg-gray-900/50" }, _attrs))}><!--[-->`);
      ssrRenderList(__props.entries, (e2, i2) => {
        _push(`<div class="${ssrRenderClass([i2 > 0 ? "border-t border-gray-800" : "", "flex items-center gap-3 px-3 py-2.5 transition hover:bg-gray-900"])}">`);
        if (e2.anime) {
          _push(ssrRenderComponent(_component_Link, {
            href: e2.anime.slug ? _ctx.route("anime.show", { anime: e2.anime.slug }) : "#",
            class: "h-[52px] w-9 flex-none overflow-hidden rounded bg-gray-800"
          }, {
            default: withCtx((_2, _push2, _parent2, _scopeId) => {
              if (_push2) {
                if (e2.anime.cover_image_medium || e2.anime.cover_image_large) {
                  _push2(`<img${ssrRenderAttr("src", e2.anime.cover_image_medium || e2.anime.cover_image_large)}${ssrRenderAttr("alt", displayTitle(e2))} loading="lazy" class="h-full w-full object-cover"${_scopeId}>`);
                } else {
                  _push2(`<!---->`);
                }
              } else {
                return [
                  e2.anime.cover_image_medium || e2.anime.cover_image_large ? (openBlock(), createBlock("img", {
                    key: 0,
                    src: e2.anime.cover_image_medium || e2.anime.cover_image_large,
                    alt: displayTitle(e2),
                    loading: "lazy",
                    class: "h-full w-full object-cover"
                  }, null, 8, ["src", "alt"])) : createCommentVNode("", true)
                ];
              }
            }),
            _: 2
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="min-w-0 flex-1">`);
        if (e2.anime) {
          _push(ssrRenderComponent(_component_Link, {
            href: e2.anime.slug ? _ctx.route("anime.show", { anime: e2.anime.slug }) : "#",
            class: "block truncate text-sm font-medium text-gray-100 transition hover:text-primary-400"
          }, {
            default: withCtx((_2, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(displayTitle(e2))}`);
              } else {
                return [
                  createTextVNode(toDisplayString(displayTitle(e2)), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-gray-500"><span class="inline-flex items-center gap-1.5"><span class="${ssrRenderClass([unref(statusDotClass)(e2.status), "h-1.5 w-1.5 rounded-full"])}"></span> ${ssrInterpolate(unref(LIST_STATUS_LABELS)[e2.status])}</span><span class="text-gray-700">·</span><span>${ssrInterpolate(seasonLabel(e2))}</span>`);
        if (genrePair(e2)) {
          _push(`<!--[--><span class="text-gray-700">·</span><span>${ssrInterpolate(genrePair(e2))}</span><!--]-->`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><div class="hidden w-44 flex-none sm:block"><div class="mb-1 flex justify-between font-mono text-[11px] text-gray-500"><span>EP ${ssrInterpolate(e2.progress)}</span><span>${ssrInterpolate(e2.anime?.episodes ?? "?")}</span></div><div class="h-[3px] overflow-hidden rounded-full bg-gray-800"><div class="h-full bg-primary-400" style="${ssrRenderStyle({ width: `${progressPercent(e2)}%` })}"></div></div></div><div class="${ssrRenderClass([e2.display_score ? "text-gray-200" : "text-gray-600", "w-12 flex-none text-right font-mono text-xs"])}">${ssrInterpolate(e2.display_score ? `★ ${e2.display_score}` : "—")}</div><button class="rounded-md border border-gray-700 bg-gray-800 px-2 py-1 font-mono text-[11px] text-gray-300 transition hover:border-primary-400 hover:text-primary-400 disabled:cursor-default disabled:text-gray-500 disabled:hover:border-gray-700 disabled:hover:text-gray-500"${ssrIncludeBooleanAttr(!canIncrement(e2)) ? " disabled" : ""} title="Add one episode">+1</button><button class="p-1 text-gray-500 transition hover:text-gray-200" title="Edit entry"><svg viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5"><circle cx="4" cy="10" r="1.5"></circle><circle cx="10" cy="10" r="1.5"></circle><circle cx="16" cy="10" r="1.5"></circle></svg></button></div>`);
      });
      _push(`<!--]-->`);
      if (__props.entries.length === 0) {
        _push(`<p class="px-4 py-8 text-center text-sm text-gray-500"> No entries found. </p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$q = _sfc_main$q.setup;
_sfc_main$q.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/LibraryRowsView.vue");
  return _sfc_setup$q ? _sfc_setup$q(props, ctx) : void 0;
};
const _sfc_main$p = /* @__PURE__ */ defineComponent({
  __name: "LibraryDataTable",
  __ssrInlineRender: true,
  props: {
    entries: {}
  },
  emits: ["edit"],
  setup(__props, { emit: __emit }) {
    function displayTitle(entry) {
      return entry.anime?.title_english || entry.anime?.title_romaji || "Unknown";
    }
    function progressPercent(entry) {
      const total = entry.anime?.episodes;
      if (!total) return 0;
      return Math.min(100, Math.max(0, entry.progress / total * 100));
    }
    function daysAgo(iso) {
      const ms = Date.now() - new Date(iso).getTime();
      const days = Math.round(ms / 864e5);
      if (days <= 0) return "today";
      if (days === 1) return "1d ago";
      if (days < 30) return `${days}d ago`;
      const months = Math.round(days / 30);
      if (months < 12) return `${months}mo ago`;
      return `${Math.round(months / 12)}y ago`;
    }
    function formatLabel(entry) {
      return entry.anime?.format?.replace(/_/g, " ") ?? "—";
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Link = resolveComponent("Link");
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "overflow-hidden rounded-lg border border-gray-800 bg-gray-900/50" }, _attrs))}><div class="grid grid-cols-[36px_minmax(0,2.4fr)_minmax(0,1fr)_60px_minmax(0,1fr)_70px_minmax(0,0.9fr)_32px] items-center gap-3 border-b border-gray-800 px-3 py-2.5 font-mono text-[10px] uppercase tracking-wider text-gray-500"><div>#</div><div>Title</div><div>Status</div><div>Score</div><div>Progress</div><div>Type</div><div>Updated</div><div></div></div><!--[-->`);
      ssrRenderList(__props.entries, (e2, i2) => {
        _push(`<div class="${ssrRenderClass([i2 > 0 ? "border-t border-gray-800" : "", "grid grid-cols-[36px_minmax(0,2.4fr)_minmax(0,1fr)_60px_minmax(0,1fr)_70px_minmax(0,0.9fr)_32px] items-center gap-3 px-3 py-2.5 text-sm transition hover:bg-gray-900"])}"><div class="font-mono text-[11px] text-gray-500">${ssrInterpolate(String(i2 + 1).padStart(2, "0"))}</div>`);
        if (e2.anime) {
          _push(ssrRenderComponent(_component_Link, {
            href: e2.anime.slug ? _ctx.route("anime.show", { anime: e2.anime.slug }) : "#",
            class: "group flex min-w-0 items-center gap-2.5"
          }, {
            default: withCtx((_2, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<div class="h-[42px] w-[30px] flex-none overflow-hidden rounded bg-gray-800"${_scopeId}>`);
                if (e2.anime.cover_image_medium || e2.anime.cover_image_large) {
                  _push2(`<img${ssrRenderAttr("src", e2.anime.cover_image_medium || e2.anime.cover_image_large)}${ssrRenderAttr("alt", displayTitle(e2))} loading="lazy" class="h-full w-full object-cover"${_scopeId}>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div><div class="min-w-0 flex-1"${_scopeId}><div class="truncate font-medium text-gray-100 transition group-hover:text-primary-400"${_scopeId}>${ssrInterpolate(displayTitle(e2))}</div><div class="truncate text-[11px] text-gray-500"${_scopeId}>${ssrInterpolate(e2.anime.title_romaji)}</div></div>`);
              } else {
                return [
                  createVNode("div", { class: "h-[42px] w-[30px] flex-none overflow-hidden rounded bg-gray-800" }, [
                    e2.anime.cover_image_medium || e2.anime.cover_image_large ? (openBlock(), createBlock("img", {
                      key: 0,
                      src: e2.anime.cover_image_medium || e2.anime.cover_image_large,
                      alt: displayTitle(e2),
                      loading: "lazy",
                      class: "h-full w-full object-cover"
                    }, null, 8, ["src", "alt"])) : createCommentVNode("", true)
                  ]),
                  createVNode("div", { class: "min-w-0 flex-1" }, [
                    createVNode("div", { class: "truncate font-medium text-gray-100 transition group-hover:text-primary-400" }, toDisplayString(displayTitle(e2)), 1),
                    createVNode("div", { class: "truncate text-[11px] text-gray-500" }, toDisplayString(e2.anime.title_romaji), 1)
                  ])
                ];
              }
            }),
            _: 2
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="inline-flex items-center gap-1.5 text-xs text-gray-300"><span class="${ssrRenderClass([unref(statusDotClass)(e2.status), "h-1.5 w-1.5 rounded-full"])}"></span> ${ssrInterpolate(unref(LIST_STATUS_LABELS)[e2.status])}</div><div class="${ssrRenderClass([e2.display_score ? "text-gray-100" : "text-gray-600", "font-mono text-xs"])}">${ssrInterpolate(e2.display_score ? `★ ${e2.display_score}` : "—")}</div><div><div class="mb-1 flex justify-between font-mono text-[11px] text-gray-500"><span>${ssrInterpolate(e2.progress)}</span><span>${ssrInterpolate(e2.anime?.episodes ?? "?")}</span></div><div class="h-[2px] overflow-hidden rounded-full bg-gray-800"><div class="h-full bg-primary-400" style="${ssrRenderStyle({ width: `${progressPercent(e2)}%` })}"></div></div></div><div class="text-xs text-gray-500">${ssrInterpolate(formatLabel(e2))}</div><div class="font-mono text-[11px] text-gray-500">${ssrInterpolate(daysAgo(e2.updated_at))}</div><button class="p-1 text-gray-500 transition hover:text-gray-200" title="Edit entry"><svg viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5"><circle cx="4" cy="10" r="1.5"></circle><circle cx="10" cy="10" r="1.5"></circle><circle cx="16" cy="10" r="1.5"></circle></svg></button></div>`);
      });
      _push(`<!--]-->`);
      if (__props.entries.length === 0) {
        _push(`<p class="px-4 py-8 text-center text-sm text-gray-500"> No entries found. </p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$p = _sfc_main$p.setup;
_sfc_main$p.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/LibraryDataTable.vue");
  return _sfc_setup$p ? _sfc_setup$p(props, ctx) : void 0;
};
const _sfc_main$o = /* @__PURE__ */ defineComponent({
  ...{ layout: _sfc_main$T },
  __name: "MyListPage",
  __ssrInlineRender: true,
  props: {
    entries: {},
    counts: {}
  },
  setup(__props) {
    const props = __props;
    const VALID_STATUSES = ["all", "watching", "completed", "plan_to_watch", "on_hold", "dropped"];
    function readStatusFromUrl() {
      if (typeof window === "undefined") return "all";
      const param = new URLSearchParams(window.location.search).get("status");
      return VALID_STATUSES.includes(param ?? "") ? param : "all";
    }
    const activeStatus = ref(readStatusFromUrl());
    const viewMode = ref("card");
    const sortField = ref("-updated_at");
    const filterText = ref("");
    const selectedGenres = ref([]);
    onMounted(() => {
      activeStatus.value = readStatusFromUrl();
      const saved = localStorage.getItem("list_view");
      if (saved && ["table", "card", "compact"].includes(saved)) {
        viewMode.value = saved;
      }
    });
    const statusFiltered = computed(
      () => activeStatus.value === "all" ? props.entries : props.entries.filter((e2) => e2.status === activeStatus.value)
    );
    const filteredEntries = computed(() => {
      let entries = statusFiltered.value;
      if (filterText.value.trim()) {
        const t3 = filterText.value.trim().toLowerCase();
        entries = entries.filter((e2) => {
          const en = e2.anime?.title_english?.toLowerCase() ?? "";
          const ro = e2.anime?.title_romaji?.toLowerCase() ?? "";
          return en.includes(t3) || ro.includes(t3);
        });
      }
      if (selectedGenres.value.length) {
        entries = entries.filter((e2) => {
          const names = (e2.anime?.genres ?? []).map((g2) => g2.name);
          return selectedGenres.value.every((g2) => names.includes(g2));
        });
      }
      const [dir, field] = sortField.value.startsWith("-") ? ["desc", sortField.value.slice(1)] : ["asc", sortField.value];
      return [...entries].sort((a2, b2) => {
        let aVal = 0;
        let bVal = 0;
        if (field === "updated_at") {
          aVal = new Date(a2.updated_at).getTime();
          bVal = new Date(b2.updated_at).getTime();
        } else if (field === "score") {
          aVal = a2.score ?? -1;
          bVal = b2.score ?? -1;
        } else if (field === "title") {
          aVal = (a2.anime?.title_english || a2.anime?.title_romaji || "").toLowerCase();
          bVal = (b2.anime?.title_english || b2.anime?.title_romaji || "").toLowerCase();
        } else if (field === "progress") {
          const aTot = a2.anime?.episodes || 1;
          const bTot = b2.anime?.episodes || 1;
          aVal = a2.progress / aTot;
          bVal = b2.progress / bTot;
        }
        if (aVal < bVal) return dir === "asc" ? -1 : 1;
        if (aVal > bVal) return dir === "asc" ? 1 : -1;
        return 0;
      });
    });
    const totalCount = computed(() => Object.values(props.counts).reduce((n2, c2) => n2 + c2, 0));
    const stats = computed(() => {
      const watching = props.counts?.watching ?? 0;
      const completed = props.counts?.completed ?? 0;
      const scored = props.entries.filter((e2) => e2.display_score != null && e2.display_score > 0);
      const avg = scored.length ? scored.reduce((n2, e2) => n2 + e2.display_score, 0) / scored.length : 0;
      const totalEp = props.entries.reduce((n2, e2) => n2 + e2.progress, 0);
      const days = Math.round(totalEp * 24 / 60 / 24 * 10) / 10;
      return { watching, completed, avg, totalEp, days };
    });
    const tabs = computed(() => {
      const base = [
        { key: "all", label: "All", count: totalCount.value }
      ];
      const statuses = ["watching", "completed", "plan_to_watch", "on_hold", "dropped"];
      statuses.forEach((s2) => base.push({ key: s2, label: LIST_STATUS_LABELS[s2], count: props.counts?.[s2] ?? 0 }));
      return base;
    });
    const allGenres = computed(() => {
      const s2 = /* @__PURE__ */ new Set();
      props.entries.forEach((e2) => (e2.anime?.genres ?? []).forEach((g2) => s2.add(g2.name)));
      return [...s2].sort();
    });
    const page = usePage();
    const user = computed(() => page.props.auth.user);
    const username = computed(() => user.value?.username ?? "you");
    const publicUrl = computed(() => {
      if (!user.value?.list_is_public || !user.value?.username) return null;
      return `${window.location.origin}/user/${user.value.username}/list`;
    });
    const listIsPublic = ref(user.value?.list_is_public ?? false);
    function togglePublic() {
      router.patch(route("settings.profile"), {
        list_is_public: listIsPublic.value
      }, { preserveState: true, preserveScroll: true });
    }
    const copied = ref(false);
    const { updateMutation } = useListMutations();
    function reloadProps() {
      router.reload({ only: ["entries", "counts"] });
    }
    function handleProgress(entry, delta) {
      const total = entry.anime?.episodes;
      const next = Math.max(0, total != null ? Math.min(total, entry.progress + delta) : entry.progress + delta);
      if (next === entry.progress) return;
      updateMutation.mutate({ id: entry.id, progress: next }, { onSuccess: reloadProps });
    }
    const editingEntry = ref(null);
    const showEditModal = ref(false);
    function openEdit(entry) {
      editingEntry.value = entry;
      showEditModal.value = true;
    }
    const sortOptions = [
      { label: "Recently updated", value: "-updated_at" },
      { label: "My score", value: "-score" },
      { label: "Title A–Z", value: "title" },
      { label: "Progress", value: "-progress" }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Head = resolveComponent("Head");
      const _component_Link = resolveComponent("Link");
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_Head, { title: "Library" }, null, _parent));
      _push(`<div class="space-y-6"><div><div class="mb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-gray-500"> Library · @${ssrInterpolate(username.value)}</div><h1 class="text-3xl font-bold tracking-tight text-gray-100 sm:text-4xl"> Your collection </h1><p class="mt-2 max-w-2xl text-sm text-gray-400">${ssrInterpolate(totalCount.value)} titles · ${ssrInterpolate(stats.value.totalEp.toLocaleString())} episodes watched · ${ssrInterpolate(stats.value.days)} days of your life. </p></div><div class="flex flex-wrap items-center gap-3 border-b border-gray-800 pb-5"><div class="flex items-center gap-2">`);
      _push(ssrRenderComponent(unref(ToggleSwitch), {
        modelValue: listIsPublic.value,
        "onUpdate:modelValue": [($event) => listIsPublic.value = $event, togglePublic]
      }, null, _parent));
      _push(`<span class="text-sm text-gray-400">Public</span></div>`);
      if (publicUrl.value) {
        _push(`<button class="${ssrRenderClass([copied.value ? "border-green-500/50 text-green-400" : "border-gray-700 text-gray-300 hover:border-gray-600", "flex items-center gap-1.5 rounded-lg border bg-gray-800 px-3 py-1.5 text-sm transition"])}">`);
        if (!copied.value) {
          _push(`<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"></path></svg>`);
        } else {
          _push(`<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>`);
        }
        _push(` ${ssrInterpolate(copied.value ? "Copied!" : "Share")}</button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<a${ssrRenderAttr("href", _ctx.route("list.export"))} class="text-sm text-gray-400 transition hover:text-gray-200">Export XML</a>`);
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("import"),
        class: "text-sm text-gray-400 transition hover:text-gray-200"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Import`);
          } else {
            return [
              createTextVNode("Import")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="grid grid-cols-2 gap-3 sm:grid-cols-4"><div class="rounded-lg border border-gray-800 bg-gray-900/50 p-4"><p class="mb-2 font-mono text-[11px] uppercase tracking-wider text-gray-500">Watching</p><p class="text-2xl font-bold text-primary-400">${ssrInterpolate(stats.value.watching)}</p><p class="mt-1 text-[11px] text-gray-500">currently</p></div><div class="rounded-lg border border-gray-800 bg-gray-900/50 p-4"><p class="mb-2 font-mono text-[11px] uppercase tracking-wider text-gray-500">Completed</p><p class="text-2xl font-bold text-gray-100">${ssrInterpolate(stats.value.completed)}</p><p class="mt-1 text-[11px] text-gray-500">all time</p></div><div class="rounded-lg border border-gray-800 bg-gray-900/50 p-4"><p class="mb-2 font-mono text-[11px] uppercase tracking-wider text-gray-500">Avg score</p><p class="text-2xl font-bold text-gray-100">${ssrInterpolate(stats.value.avg ? stats.value.avg.toFixed(1) : "—")}</p><p class="mt-1 text-[11px] text-gray-500">on scored entries</p></div><div class="rounded-lg border border-gray-800 bg-gray-900/50 p-4"><p class="mb-2 font-mono text-[11px] uppercase tracking-wider text-gray-500">Time spent</p><p class="text-2xl font-bold text-gray-100">${ssrInterpolate(stats.value.days)}d</p><p class="mt-1 text-[11px] text-gray-500">${ssrInterpolate(stats.value.totalEp)} episodes</p></div></div><div class="flex items-center gap-1 overflow-x-auto border-b border-gray-800"><!--[-->`);
      ssrRenderList(tabs.value, (t3) => {
        _push(`<button class="${ssrRenderClass([activeStatus.value === t3.key ? "border-primary-400 font-medium text-primary-400" : "border-transparent text-gray-400 hover:text-gray-200", "-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm transition"])}">`);
        if (t3.key !== "all") {
          _push(`<span class="${ssrRenderClass([unref(statusDotClass)(t3.key), "h-1.5 w-1.5 rounded-full"])}"></span>`);
        } else {
          _push(`<!---->`);
        }
        _push(` ${ssrInterpolate(t3.label)} <span class="font-mono text-[11px] text-gray-500">${ssrInterpolate(t3.count)}</span></button>`);
      });
      _push(`<!--]--></div><div class="flex flex-wrap items-center gap-2"><div class="flex min-w-[220px] max-w-[340px] flex-1 items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-gray-400 focus-within:border-gray-600"><svg viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"></path></svg><input${ssrRenderAttr("value", filterText.value)} type="text" placeholder="Filter your list…" class="flex-1 border-0 bg-transparent text-sm text-gray-100 outline-none placeholder:text-gray-500"></div><select class="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-300"><!--[-->`);
      ssrRenderList(sortOptions, (opt) => {
        _push(`<option${ssrRenderAttr("value", opt.value)}${ssrIncludeBooleanAttr(Array.isArray(sortField.value) ? ssrLooseContain(sortField.value, opt.value) : ssrLooseEqual(sortField.value, opt.value)) ? " selected" : ""}>${ssrInterpolate(opt.label)}</option>`);
      });
      _push(`<!--]--></select><div class="flex-1"></div><div class="flex overflow-hidden rounded-lg border border-gray-700 bg-gray-800"><!--[-->`);
      ssrRenderList([["card", "Grid"], ["compact", "Rows"], ["table", "Table"]], ([key, label]) => {
        _push(`<button class="${ssrRenderClass([[
          viewMode.value === key ? "bg-gray-700 text-gray-100" : "text-gray-500 hover:text-gray-300",
          key !== "table" ? "border-r border-gray-700" : ""
        ], "flex items-center justify-center px-2.5 py-1.5 transition"])}"${ssrRenderAttr("title", label)}>`);
        if (key === "card") {
          _push(`<svg viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5"><path d="M3 3h6v6H3V3zm8 0h6v6h-6V3zm-8 8h6v6H3v-6zm8 0h6v6h-6v-6z"></path></svg>`);
        } else if (key === "compact") {
          _push(`<svg viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5"><path d="M3 4h14v3H3V4zm0 5h14v3H3V9zm0 5h14v3H3v-3z"></path></svg>`);
        } else {
          _push(`<svg viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5"><path d="M3 4h14v2H3V4zm0 4h14v2H3V8zm0 4h14v2H3v-2zm0 4h14v2H3v-2z"></path></svg>`);
        }
        _push(`</button>`);
      });
      _push(`<!--]--></div></div>`);
      if (allGenres.value.length > 0) {
        _push(`<div class="flex flex-wrap gap-1.5"><!--[-->`);
        ssrRenderList(allGenres.value.slice(0, 14), (g2) => {
          _push(`<button class="${ssrRenderClass([selectedGenres.value.includes(g2) ? "border-primary-400 bg-primary-400/10 text-primary-300" : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200", "rounded-full border px-3 py-1 text-xs transition"])}">${ssrInterpolate(g2)}</button>`);
        });
        _push(`<!--]-->`);
        if (selectedGenres.value.length) {
          _push(`<button class="rounded-full border border-dashed border-gray-700 px-3 py-1 text-xs text-gray-500 hover:text-gray-300">Clear</button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      if (filteredEntries.value.length === 0) {
        _push(`<div class="rounded-xl border border-dashed border-gray-700 bg-gray-900/30 px-6 py-16 text-center"><p class="text-lg font-medium text-gray-200">Nothing here yet</p><p class="mt-1 text-sm text-gray-500">`);
        if (filterText.value || selectedGenres.value.length) {
          _push(`<!--[-->No entries match your filters.<!--]-->`);
        } else {
          _push(`<!--[-->Start by searching for an anime or importing from MAL.<!--]-->`);
        }
        _push(`</p></div>`);
      } else if (viewMode.value === "card") {
        _push(ssrRenderComponent(_sfc_main$r, {
          entries: filteredEntries.value,
          onEdit: openEdit,
          onProgress: handleProgress
        }, null, _parent));
      } else if (viewMode.value === "compact") {
        _push(ssrRenderComponent(_sfc_main$q, {
          entries: filteredEntries.value,
          onEdit: openEdit,
          onProgress: handleProgress
        }, null, _parent));
      } else {
        _push(ssrRenderComponent(_sfc_main$p, {
          entries: filteredEntries.value,
          onEdit: openEdit
        }, null, _parent));
      }
      if (showEditModal.value && editingEntry.value?.anime) {
        _push(ssrRenderComponent(_sfc_main$G, {
          anime: editingEntry.value.anime,
          entry: editingEntry.value,
          onClose: ($event) => showEditModal.value = false,
          onSaved: () => {
            showEditModal.value = false;
            reloadProps();
          },
          onDeleted: () => {
            showEditModal.value = false;
            reloadProps();
          }
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div><!--]-->`);
    };
  }
});
const _sfc_setup$o = _sfc_main$o.setup;
_sfc_main$o.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/MyListPage.vue");
  return _sfc_setup$o ? _sfc_setup$o(props, ctx) : void 0;
};
const __vite_glob_0_15 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main$o
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main$n = /* @__PURE__ */ defineComponent({
  ...{ layout: _sfc_main$T },
  __name: "NotFoundPage",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Head = resolveComponent("Head");
      const _component_Link = resolveComponent("Link");
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_Head, { title: "404 - Not Found" }, null, _parent));
      _push(`<div class="text-center mt-24"><h1 class="text-6xl font-bold text-gray-700">404</h1><p class="text-gray-400 mt-4">Page not found.</p>`);
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("home"),
        class: "text-primary-400 hover:text-primary-300 mt-6 inline-block"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Go Home`);
          } else {
            return [
              createTextVNode("Go Home")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><!--]-->`);
    };
  }
});
const _sfc_setup$n = _sfc_main$n.setup;
_sfc_main$n.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/NotFoundPage.vue");
  return _sfc_setup$n ? _sfc_setup$n(props, ctx) : void 0;
};
const __vite_glob_0_16 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main$n
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main$m = /* @__PURE__ */ defineComponent({
  ...{ layout: _sfc_main$T },
  __name: "PeopleIndexPage",
  __ssrInlineRender: true,
  props: {
    people: {},
    filters: {}
  },
  setup(__props) {
    const props = __props;
    const search = ref(props.filters.search);
    function personUrl(person) {
      return person.slug ? route("people.show", { person: person.slug }) : "#";
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Head = resolveComponent("Head");
      const _component_Link = resolveComponent("Link");
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_Head, { title: "Voice Actors" }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<meta name="description" content="Browse Japanese voice actors and their anime roles on AniTrack."${_scopeId}><link rel="canonical"${ssrRenderAttr("href", _ctx.route("people.index"))}${_scopeId}>`);
          } else {
            return [
              createVNode("meta", {
                name: "description",
                content: "Browse Japanese voice actors and their anime roles on AniTrack."
              }),
              createVNode("link", {
                rel: "canonical",
                href: _ctx.route("people.index")
              }, null, 8, ["href"])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div><div class="mb-6"><h1 class="text-2xl font-bold text-gray-100 md:text-3xl">Voice Actors</h1><p class="mt-1 text-sm text-gray-400"> Browse ${ssrInterpolate(__props.people.meta.total.toLocaleString())} Japanese voice actors. </p></div><div class="mb-6"><form><input${ssrRenderAttr("value", search.value)} type="search" placeholder="Search voice actors..." class="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-gray-200 placeholder-gray-500 outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500"></form></div>`);
      if (__props.people.data.length) {
        _push(`<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"><!--[-->`);
        ssrRenderList(__props.people.data, (person) => {
          _push(ssrRenderComponent(_component_Link, {
            key: person.id,
            href: personUrl(person),
            class: "group block"
          }, {
            default: withCtx((_2, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<div class="aspect-[3/4] overflow-hidden rounded-lg bg-gray-800"${_scopeId}>`);
                if (person.image_medium) {
                  _push2(`<img${ssrRenderAttr("src", person.image_medium)}${ssrRenderAttr("alt", person.name_full)} class="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy"${_scopeId}>`);
                } else {
                  _push2(`<div class="flex h-full items-center justify-center text-gray-600"${_scopeId}><span class="text-4xl"${_scopeId}>?</span></div>`);
                }
                _push2(`</div><div class="mt-2"${_scopeId}><h3 class="line-clamp-2 text-sm font-medium text-gray-200 group-hover:text-primary-400 transition"${_scopeId}>${ssrInterpolate(person.name_full)}</h3>`);
                if (person.name_native) {
                  _push2(`<p class="line-clamp-1 text-xs text-gray-500"${_scopeId}>${ssrInterpolate(person.name_native)}</p>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`<p class="mt-0.5 text-xs text-gray-500"${_scopeId}>${ssrInterpolate(person.role_count)} role${ssrInterpolate(person.role_count === 1 ? "" : "s")}</p></div>`);
              } else {
                return [
                  createVNode("div", { class: "aspect-[3/4] overflow-hidden rounded-lg bg-gray-800" }, [
                    person.image_medium ? (openBlock(), createBlock("img", {
                      key: 0,
                      src: person.image_medium,
                      alt: person.name_full,
                      class: "h-full w-full object-cover transition-transform group-hover:scale-105",
                      loading: "lazy"
                    }, null, 8, ["src", "alt"])) : (openBlock(), createBlock("div", {
                      key: 1,
                      class: "flex h-full items-center justify-center text-gray-600"
                    }, [
                      createVNode("span", { class: "text-4xl" }, "?")
                    ]))
                  ]),
                  createVNode("div", { class: "mt-2" }, [
                    createVNode("h3", { class: "line-clamp-2 text-sm font-medium text-gray-200 group-hover:text-primary-400 transition" }, toDisplayString(person.name_full), 1),
                    person.name_native ? (openBlock(), createBlock("p", {
                      key: 0,
                      class: "line-clamp-1 text-xs text-gray-500"
                    }, toDisplayString(person.name_native), 1)) : createCommentVNode("", true),
                    createVNode("p", { class: "mt-0.5 text-xs text-gray-500" }, toDisplayString(person.role_count) + " role" + toDisplayString(person.role_count === 1 ? "" : "s"), 1)
                  ])
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<div class="py-16 text-center"><p class="text-gray-500">No voice actors found.</p></div>`);
      }
      _push(`<div class="mt-8">`);
      _push(ssrRenderComponent(_sfc_main$Q, {
        "current-page": __props.people.meta.current_page,
        "last-page": __props.people.meta.last_page,
        total: __props.people.meta.total
      }, null, _parent));
      _push(`</div></div><!--]-->`);
    };
  }
});
const _sfc_setup$m = _sfc_main$m.setup;
_sfc_main$m.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/PeopleIndexPage.vue");
  return _sfc_setup$m ? _sfc_setup$m(props, ctx) : void 0;
};
const __vite_glob_0_17 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main$m
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main$l = /* @__PURE__ */ defineComponent({
  ...{ layout: _sfc_main$T },
  __name: "PersonDetailPage",
  __ssrInlineRender: true,
  props: {
    person: {},
    roles: {},
    og: {}
  },
  setup(__props) {
    function formatLabel(format) {
      if (!format) return "";
      return format.replace(/_/g, " ");
    }
    function animeUrl(anime) {
      if (!anime) return "#";
      if (anime.slug) return route("anime.show", { anime: anime.slug });
      return "#";
    }
    function formatBirthdate(date) {
      if (!date) return "";
      return new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Head = resolveComponent("Head");
      const _component_Link = resolveComponent("Link");
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_Head, {
        title: __props.person.name_full
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<meta name="description"${ssrRenderAttr("content", __props.og.description)}${_scopeId}><link rel="canonical"${ssrRenderAttr("href", __props.og.url)}${_scopeId}><meta property="og:title"${ssrRenderAttr("content", __props.og.title)}${_scopeId}><meta property="og:description"${ssrRenderAttr("content", __props.og.description)}${_scopeId}>`);
            if (__props.og.image) {
              _push2(`<meta property="og:image"${ssrRenderAttr("content", __props.og.image)}${_scopeId}>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<meta property="og:url"${ssrRenderAttr("content", __props.og.url)}${_scopeId}><meta property="og:type" content="profile"${_scopeId}>`);
          } else {
            return [
              createVNode("meta", {
                name: "description",
                content: __props.og.description
              }, null, 8, ["content"]),
              createVNode("link", {
                rel: "canonical",
                href: __props.og.url
              }, null, 8, ["href"]),
              createVNode("meta", {
                property: "og:title",
                content: __props.og.title
              }, null, 8, ["content"]),
              createVNode("meta", {
                property: "og:description",
                content: __props.og.description
              }, null, 8, ["content"]),
              __props.og.image ? (openBlock(), createBlock("meta", {
                key: 0,
                property: "og:image",
                content: __props.og.image
              }, null, 8, ["content"])) : createCommentVNode("", true),
              createVNode("meta", {
                property: "og:url",
                content: __props.og.url
              }, null, 8, ["content"]),
              createVNode("meta", {
                property: "og:type",
                content: "profile"
              })
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div><div class="mb-6 text-sm text-gray-500">`);
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("people.index"),
        class: "text-primary-400 hover:text-primary-300"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Voice Actors`);
          } else {
            return [
              createTextVNode("Voice Actors")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<span class="mx-2 text-gray-600">/</span><span>${ssrInterpolate(__props.person.name_full)}</span></div><div class="flex flex-col gap-6 md:flex-row"><div class="w-full shrink-0 md:w-56"><div class="overflow-hidden rounded-lg bg-gray-800">`);
      if (__props.person.image_large || __props.person.image_medium) {
        _push(`<img${ssrRenderAttr("src", __props.person.image_large || __props.person.image_medium)}${ssrRenderAttr("alt", __props.person.name_full)} class="w-full" loading="lazy">`);
      } else {
        _push(`<div class="flex aspect-[3/4] items-center justify-center text-gray-600"><span class="text-5xl">?</span></div>`);
      }
      _push(`</div><div class="mt-4 rounded-lg border border-gray-800 p-3 space-y-2 text-sm">`);
      if (__props.person.gender) {
        _push(`<div class="flex items-start justify-between gap-3"><span class="text-gray-500 shrink-0">Gender</span><span class="text-gray-200 text-right">${ssrInterpolate(__props.person.gender)}</span></div>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.person.birthdate) {
        _push(`<div class="flex items-start justify-between gap-3"><span class="text-gray-500 shrink-0">Born</span><span class="text-gray-200 text-right">${ssrInterpolate(formatBirthdate(__props.person.birthdate))}</span></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="flex items-start justify-between gap-3"><span class="text-gray-500 shrink-0">Roles</span><span class="text-gray-200 text-right">${ssrInterpolate(__props.person.role_count.toLocaleString())}</span></div>`);
      if (__props.person.site_url) {
        _push(`<div class="pt-1"><a${ssrRenderAttr("href", __props.person.site_url)} target="_blank" rel="noopener noreferrer" class="text-xs text-primary-400 hover:text-primary-300"> AniList → </a></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="min-w-0 flex-1 space-y-6"><div><h1 class="text-2xl font-bold text-gray-100 md:text-3xl">${ssrInterpolate(__props.person.name_full)}</h1>`);
      if (__props.person.name_native) {
        _push(`<p class="mt-1 text-gray-400">${ssrInterpolate(__props.person.name_native)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (__props.roles.data.length) {
        _push(`<div><h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400"> Voice Acting Roles </h2><div class="space-y-2"><!--[-->`);
        ssrRenderList(__props.roles.data, (role, idx) => {
          _push(ssrRenderComponent(_component_Link, {
            key: `${role.anime?.id ?? "x"}-${role.character?.id ?? idx}`,
            href: animeUrl(role.anime),
            class: "group flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-900/40 p-2 transition hover:border-primary-600 hover:bg-gray-900"
          }, {
            default: withCtx((_2, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<div class="h-20 w-14 shrink-0 overflow-hidden rounded-md bg-gray-800"${_scopeId}>`);
                if (role.anime?.cover_image_medium) {
                  _push2(`<img${ssrRenderAttr("src", role.anime.cover_image_medium)}${ssrRenderAttr("alt", role.anime.title_romaji)} class="h-full w-full object-cover" loading="lazy"${_scopeId}>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div><div class="min-w-0 flex-1"${_scopeId}><h3 class="truncate text-sm font-medium text-gray-100 group-hover:text-primary-400 transition"${_scopeId}>${ssrInterpolate(role.anime?.title_english || role.anime?.title_romaji || "Unknown anime")}</h3><div class="mt-0.5 flex items-center gap-2 text-xs text-gray-500"${_scopeId}>`);
                if (role.anime?.format) {
                  _push2(`<span${_scopeId}>${ssrInterpolate(formatLabel(role.anime.format))}</span>`);
                } else {
                  _push2(`<!---->`);
                }
                if (role.anime?.season_year) {
                  _push2(`<span${_scopeId}>· ${ssrInterpolate(role.anime.season_year)}</span>`);
                } else {
                  _push2(`<!---->`);
                }
                if (role.anime) {
                  _push2(ssrRenderComponent(_sfc_main$H, {
                    score: role.anime.average_score,
                    size: "sm"
                  }, null, _parent2, _scopeId));
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div></div><div class="flex shrink-0 items-center gap-2 text-right"${_scopeId}><div class="min-w-0"${_scopeId}><p class="truncate text-sm text-gray-200"${_scopeId}>${ssrInterpolate(role.character?.name_full || "—")}</p>`);
                if (role.character?.name_native) {
                  _push2(`<p class="truncate text-xs text-gray-500"${_scopeId}>${ssrInterpolate(role.character.name_native)}</p>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div><div class="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-800"${_scopeId}>`);
                if (role.character?.image_medium) {
                  _push2(`<img${ssrRenderAttr("src", role.character.image_medium)}${ssrRenderAttr("alt", role.character.name_full)} class="h-full w-full object-cover" loading="lazy"${_scopeId}>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div></div>`);
              } else {
                return [
                  createVNode("div", { class: "h-20 w-14 shrink-0 overflow-hidden rounded-md bg-gray-800" }, [
                    role.anime?.cover_image_medium ? (openBlock(), createBlock("img", {
                      key: 0,
                      src: role.anime.cover_image_medium,
                      alt: role.anime.title_romaji,
                      class: "h-full w-full object-cover",
                      loading: "lazy"
                    }, null, 8, ["src", "alt"])) : createCommentVNode("", true)
                  ]),
                  createVNode("div", { class: "min-w-0 flex-1" }, [
                    createVNode("h3", { class: "truncate text-sm font-medium text-gray-100 group-hover:text-primary-400 transition" }, toDisplayString(role.anime?.title_english || role.anime?.title_romaji || "Unknown anime"), 1),
                    createVNode("div", { class: "mt-0.5 flex items-center gap-2 text-xs text-gray-500" }, [
                      role.anime?.format ? (openBlock(), createBlock("span", { key: 0 }, toDisplayString(formatLabel(role.anime.format)), 1)) : createCommentVNode("", true),
                      role.anime?.season_year ? (openBlock(), createBlock("span", { key: 1 }, "· " + toDisplayString(role.anime.season_year), 1)) : createCommentVNode("", true),
                      role.anime ? (openBlock(), createBlock(_sfc_main$H, {
                        key: 2,
                        score: role.anime.average_score,
                        size: "sm"
                      }, null, 8, ["score"])) : createCommentVNode("", true)
                    ])
                  ]),
                  createVNode("div", { class: "flex shrink-0 items-center gap-2 text-right" }, [
                    createVNode("div", { class: "min-w-0" }, [
                      createVNode("p", { class: "truncate text-sm text-gray-200" }, toDisplayString(role.character?.name_full || "—"), 1),
                      role.character?.name_native ? (openBlock(), createBlock("p", {
                        key: 0,
                        class: "truncate text-xs text-gray-500"
                      }, toDisplayString(role.character.name_native), 1)) : createCommentVNode("", true)
                    ]),
                    createVNode("div", { class: "h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-800" }, [
                      role.character?.image_medium ? (openBlock(), createBlock("img", {
                        key: 0,
                        src: role.character.image_medium,
                        alt: role.character.name_full,
                        class: "h-full w-full object-cover",
                        loading: "lazy"
                      }, null, 8, ["src", "alt"])) : createCommentVNode("", true)
                    ])
                  ])
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></div><div class="mt-8">`);
        _push(ssrRenderComponent(_sfc_main$Q, {
          "current-page": __props.roles.meta.current_page,
          "last-page": __props.roles.meta.last_page,
          total: __props.roles.meta.total
        }, null, _parent));
        _push(`</div></div>`);
      } else {
        _push(`<div class="py-16 text-center"><p class="text-gray-500">No roles recorded yet.</p></div>`);
      }
      _push(`</div></div></div><!--]-->`);
    };
  }
});
const _sfc_setup$l = _sfc_main$l.setup;
_sfc_main$l.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/PersonDetailPage.vue");
  return _sfc_setup$l ? _sfc_setup$l(props, ctx) : void 0;
};
const __vite_glob_0_18 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main$l
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main$k = /* @__PURE__ */ defineComponent({
  ...{ layout: _sfc_main$T },
  __name: "PlaylistDetailPage",
  __ssrInlineRender: true,
  props: {
    playlist: {},
    isOwner: { type: Boolean }
  },
  setup(__props) {
    function displayTitle(anime) {
      return anime.title_english || anime.title_romaji;
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Head = resolveComponent("Head");
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_Head, {
        title: __props.playlist.title
      }, null, _parent));
      _push(`<div class="max-w-3xl mx-auto"><div class="mb-6"><div class="flex items-start justify-between gap-4"><div><h1 class="text-2xl font-bold">${ssrInterpolate(__props.playlist.title)}</h1><p class="text-sm text-gray-500 mt-1"> by `);
      _push(ssrRenderComponent(unref(Link), {
        href: _ctx.route("profile.show", { user: __props.playlist.user.username }),
        class: "text-primary-400 hover:text-primary-300"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`${ssrInterpolate(__props.playlist.user.username)}`);
          } else {
            return [
              createTextVNode(toDisplayString(__props.playlist.user.username), 1)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(` · ${ssrInterpolate(__props.playlist.item_count)} anime </p></div>`);
      if (__props.isOwner) {
        _push(ssrRenderComponent(unref(Link), {
          href: _ctx.route("playlists.edit", { playlist: __props.playlist.slug })
        }, {
          default: withCtx((_2, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(unref(Button), {
                label: "Edit",
                size: "small",
                severity: "secondary"
              }, null, _parent2, _scopeId));
            } else {
              return [
                createVNode(unref(Button), {
                  label: "Edit",
                  size: "small",
                  severity: "secondary"
                })
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (__props.playlist.description) {
        _push(`<p class="text-gray-400 text-sm mt-3">${ssrInterpolate(__props.playlist.description)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="space-y-2"><!--[-->`);
      ssrRenderList(__props.playlist.items, (item) => {
        _push(`<div class="${ssrRenderClass([item.is_optional ? "border-gray-800/50 border-dashed" : "border-gray-800", "flex gap-3 bg-gray-900 border rounded-lg p-3"])}"><div class="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-sm font-medium text-gray-400">${ssrInterpolate(item.position)}</div>`);
        ssrRenderVNode(_push, createVNode(resolveDynamicComponent(item.anime.slug ? unref(Link) : "div"), mergeProps({ ref_for: true }, item.anime.slug ? { href: _ctx.route("anime.show", { anime: item.anime.slug }) } : {}, { class: "flex-shrink-0" }), {
          default: withCtx((_2, _push2, _parent2, _scopeId) => {
            if (_push2) {
              if (item.anime.cover_image_medium) {
                _push2(`<img${ssrRenderAttr("src", item.anime.cover_image_medium)}${ssrRenderAttr("alt", displayTitle(item.anime))} class="w-12 h-16 object-cover rounded"${_scopeId}>`);
              } else {
                _push2(`<!---->`);
              }
            } else {
              return [
                item.anime.cover_image_medium ? (openBlock(), createBlock("img", {
                  key: 0,
                  src: item.anime.cover_image_medium,
                  alt: displayTitle(item.anime),
                  class: "w-12 h-16 object-cover rounded"
                }, null, 8, ["src", "alt"])) : createCommentVNode("", true)
              ];
            }
          }),
          _: 2
        }), _parent);
        _push(`<div class="flex-1 min-w-0"><div class="flex items-center gap-2">`);
        ssrRenderVNode(_push, createVNode(resolveDynamicComponent(item.anime.slug ? unref(Link) : "span"), mergeProps({ ref_for: true }, item.anime.slug ? { href: _ctx.route("anime.show", { anime: item.anime.slug }) } : {}, {
          class: ["font-medium text-gray-100 truncate", item.anime.slug ? "hover:text-primary-400 transition" : ""]
        }), {
          default: withCtx((_2, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(displayTitle(item.anime))}`);
            } else {
              return [
                createTextVNode(toDisplayString(displayTitle(item.anime)), 1)
              ];
            }
          }),
          _: 2
        }), _parent);
        if (item.is_optional) {
          _push(`<span class="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded"> Optional </span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="text-xs text-gray-500 mt-0.5">${ssrInterpolate(item.anime.format)} · ${ssrInterpolate(item.anime.episodes ? `${item.anime.episodes} eps` : "Ongoing")}</div>`);
        if (item.note) {
          _push(`<p class="text-sm text-gray-400 mt-1">${ssrInterpolate(item.note)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      });
      _push(`<!--]--></div>`);
      if (__props.playlist.items.length === 0) {
        _push(`<div class="text-center py-12 text-gray-500"> This playlist is empty. </div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><!--]-->`);
    };
  }
});
const _sfc_setup$k = _sfc_main$k.setup;
_sfc_main$k.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/PlaylistDetailPage.vue");
  return _sfc_setup$k ? _sfc_setup$k(props, ctx) : void 0;
};
const __vite_glob_0_19 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main$k
}, Symbol.toStringTag, { value: "Module" }));
function usePlaylistMutations() {
  const storeMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await axios.post("/api/playlists", payload);
      return data.playlist;
    }
  });
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...patch }) => {
      const { data } = await axios.patch(`/api/playlists/${id}`, patch);
      return data.playlist;
    }
  });
  const destroyMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`/api/playlists/${id}`);
    }
  });
  const addItemMutation = useMutation({
    mutationFn: async ({ playlistId, ...payload }) => {
      const { data } = await axios.post(`/api/playlists/${playlistId}/items`, payload);
      return data;
    }
  });
  const updateItemMutation = useMutation({
    mutationFn: async ({ playlistId, itemId, ...patch }) => {
      const { data } = await axios.patch(`/api/playlists/${playlistId}/items/${itemId}`, patch);
      return data;
    }
  });
  const removeItemMutation = useMutation({
    mutationFn: async ({ playlistId, itemId }) => {
      await axios.delete(`/api/playlists/${playlistId}/items/${itemId}`);
    }
  });
  const reorderMutation = useMutation({
    mutationFn: async ({ playlistId, itemIds }) => {
      await axios.patch(`/api/playlists/${playlistId}/reorder`, { item_ids: itemIds });
    }
  });
  return {
    storeMutation,
    updateMutation,
    destroyMutation,
    addItemMutation,
    updateItemMutation,
    removeItemMutation,
    reorderMutation
  };
}
const _sfc_main$j = /* @__PURE__ */ defineComponent({
  ...{ layout: _sfc_main$T },
  __name: "PlaylistEditPage",
  __ssrInlineRender: true,
  props: {
    playlist: {}
  },
  setup(__props) {
    const props = __props;
    const isNew = computed(() => !props.playlist);
    const title = ref(props.playlist?.title ?? "");
    const description = ref(props.playlist?.description ?? "");
    const isPublic = ref(props.playlist?.is_public ?? true);
    const items = ref(props.playlist?.items ?? []);
    const saving = ref(false);
    const searchQuery = ref("");
    const searchResults = ref([]);
    const searching = ref(false);
    let searchTimeout = null;
    const { storeMutation, updateMutation, destroyMutation } = usePlaylistMutations();
    function onSearchInput() {
      if (searchTimeout) clearTimeout(searchTimeout);
      if (!searchQuery.value.trim()) {
        searchResults.value = [];
        return;
      }
      searchTimeout = setTimeout(async () => {
        searching.value = true;
        try {
          const { data } = await axios.get(route("api.search"), {
            params: { q: searchQuery.value }
          });
          searchResults.value = data.data.filter(
            (anime) => !items.value.some((i2) => i2.anime.id === anime.id)
          );
        } catch {
          searchResults.value = [];
        } finally {
          searching.value = false;
        }
      }, 300);
    }
    function displayTitle(anime) {
      return anime.title_english || anime.title_romaji;
    }
    async function savePlaylist() {
      saving.value = true;
      try {
        if (isNew.value) {
          const playlist = await storeMutation.mutateAsync({
            title: title.value,
            description: description.value || null,
            is_public: isPublic.value
          });
          router.visit(route("playlists.edit", { playlist: playlist.slug }));
        } else {
          await updateMutation.mutateAsync({
            id: props.playlist.id,
            title: title.value,
            description: description.value || null,
            is_public: isPublic.value
          });
        }
      } finally {
        saving.value = false;
      }
    }
    async function deletePlaylist() {
      if (!props.playlist || !confirm("Delete this playlist?")) return;
      await destroyMutation.mutateAsync(props.playlist.id);
      router.visit(route("playlists.index"));
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Head = resolveComponent("Head");
      const _component_Link = resolveComponent("Link");
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_Head, {
        title: isNew.value ? "Create Playlist" : `Edit: ${__props.playlist.title}`
      }, null, _parent));
      _push(`<div class="max-w-3xl mx-auto"><div class="flex items-center justify-between mb-6"><h1 class="text-2xl font-bold">${ssrInterpolate(isNew.value ? "Create Playlist" : "Edit Playlist")}</h1>`);
      if (!isNew.value) {
        _push(`<div class="flex gap-2">`);
        _push(ssrRenderComponent(_component_Link, {
          href: _ctx.route("playlist.show", { playlist: __props.playlist.slug })
        }, {
          default: withCtx((_2, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(unref(Button), {
                label: "View",
                size: "small",
                severity: "secondary",
                text: ""
              }, null, _parent2, _scopeId));
            } else {
              return [
                createVNode(unref(Button), {
                  label: "View",
                  size: "small",
                  severity: "secondary",
                  text: ""
                })
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(unref(Button), {
          label: "Delete",
          size: "small",
          severity: "danger",
          text: "",
          onClick: deletePlaylist
        }, null, _parent));
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4 mb-6"><div><label class="block text-sm text-gray-400 mb-1">Title</label>`);
      _push(ssrRenderComponent(unref(InputText), {
        modelValue: title.value,
        "onUpdate:modelValue": ($event) => title.value = $event,
        class: "w-full",
        placeholder: "e.g. Gundam Watch Order"
      }, null, _parent));
      _push(`</div><div><label class="block text-sm text-gray-400 mb-1">Description</label>`);
      _push(ssrRenderComponent(unref(Textarea), {
        modelValue: description.value,
        "onUpdate:modelValue": ($event) => description.value = $event,
        class: "w-full",
        rows: "3",
        placeholder: "Describe this watch order..."
      }, null, _parent));
      _push(`</div><div class="flex items-center gap-3">`);
      _push(ssrRenderComponent(unref(ToggleSwitch), {
        modelValue: isPublic.value,
        "onUpdate:modelValue": ($event) => isPublic.value = $event
      }, null, _parent));
      _push(`<label class="text-sm text-gray-300 cursor-pointer">Public</label></div>`);
      _push(ssrRenderComponent(unref(Button), {
        label: isNew.value ? "Create Playlist" : "Save Changes",
        loading: saving.value,
        onClick: savePlaylist,
        disabled: !title.value.trim()
      }, null, _parent));
      _push(`</div>`);
      if (!isNew.value) {
        _push(`<!--[--><div class="mb-4"><label class="block text-sm text-gray-400 mb-1">Add anime</label>`);
        _push(ssrRenderComponent(unref(InputText), {
          modelValue: searchQuery.value,
          "onUpdate:modelValue": ($event) => searchQuery.value = $event,
          class: "w-full",
          placeholder: "Search for anime to add...",
          onInput: onSearchInput
        }, null, _parent));
        if (searchResults.value.length > 0) {
          _push(`<div class="mt-1 bg-gray-900 border border-gray-700 rounded-lg overflow-hidden max-h-60 overflow-y-auto"><!--[-->`);
          ssrRenderList(searchResults.value, (anime) => {
            _push(`<button class="flex items-center gap-3 w-full px-3 py-2 hover:bg-gray-800 text-left transition">`);
            if (anime.cover_image_medium) {
              _push(`<img${ssrRenderAttr("src", anime.cover_image_medium)}${ssrRenderAttr("alt", displayTitle(anime))} class="w-8 h-11 object-cover rounded">`);
            } else {
              _push(`<!---->`);
            }
            _push(`<div class="flex-1 min-w-0"><div class="text-sm text-gray-100 truncate">${ssrInterpolate(displayTitle(anime))}</div><div class="text-xs text-gray-500">${ssrInterpolate(anime.format)} · ${ssrInterpolate(anime.episodes ? `${anime.episodes} eps` : "Ongoing")}</div></div></button>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="space-y-2"><!--[-->`);
        ssrRenderList(items.value, (item, index) => {
          _push(`<div class="bg-gray-900 border border-gray-800 rounded-lg p-3"><div class="flex items-center gap-3"><div class="flex flex-col gap-0.5"><button class="text-gray-500 hover:text-gray-300 disabled:opacity-30 text-xs"${ssrIncludeBooleanAttr(index === 0) ? " disabled" : ""}>▲</button><button class="text-gray-500 hover:text-gray-300 disabled:opacity-30 text-xs"${ssrIncludeBooleanAttr(index === items.value.length - 1) ? " disabled" : ""}>▼</button></div><span class="text-sm text-gray-500 w-6 text-center">${ssrInterpolate(index + 1)}</span>`);
          if (item.anime.cover_image_medium) {
            _push(`<img${ssrRenderAttr("src", item.anime.cover_image_medium)}${ssrRenderAttr("alt", displayTitle(item.anime))} class="w-10 h-14 object-cover rounded flex-shrink-0">`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="flex-1 min-w-0"><div class="text-sm font-medium text-gray-100 truncate">${ssrInterpolate(displayTitle(item.anime))}</div><div class="text-xs text-gray-500">${ssrInterpolate(item.anime.format)} · ${ssrInterpolate(item.anime.episodes ? `${item.anime.episodes} eps` : "Ongoing")}</div></div><label class="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer flex-shrink-0"><input type="checkbox"${ssrIncludeBooleanAttr(item.is_optional) ? " checked" : ""} class="rounded border-gray-600"> Optional </label><button class="text-gray-500 hover:text-red-400 transition text-sm flex-shrink-0"> × </button></div><div class="mt-2 ml-14"><input${ssrRenderAttr("value", item.note ?? "")} type="text" class="w-full bg-transparent border-0 border-b border-gray-800 text-sm text-gray-400 placeholder-gray-600 focus:border-primary-500 focus:ring-0 px-0 py-1" placeholder="Add a note (e.g. &#39;Watch after Season 1 episode 12&#39;)..."></div></div>`);
        });
        _push(`<!--]--></div>`);
        if (items.value.length === 0) {
          _push(`<div class="text-center py-8 text-gray-500 text-sm"> Search above to add anime to this playlist. </div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--]-->`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><!--]-->`);
    };
  }
});
const _sfc_setup$j = _sfc_main$j.setup;
_sfc_main$j.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/PlaylistEditPage.vue");
  return _sfc_setup$j ? _sfc_setup$j(props, ctx) : void 0;
};
const __vite_glob_0_20 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main$j
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main$i = /* @__PURE__ */ defineComponent({
  ...{ layout: _sfc_main$T },
  __name: "PlaylistsIndexPage",
  __ssrInlineRender: true,
  props: {
    playlists: {}
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Head = resolveComponent("Head");
      const _component_Link = resolveComponent("Link");
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_Head, { title: "My Playlists" }, null, _parent));
      _push(`<div><div class="flex items-center justify-between mb-6"><h1 class="text-2xl font-bold">My Playlists</h1>`);
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("playlists.create")
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(unref(Button), {
              label: "Create Playlist",
              size: "small"
            }, null, _parent2, _scopeId));
          } else {
            return [
              createVNode(unref(Button), {
                label: "Create Playlist",
                size: "small"
              })
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
      if (__props.playlists.length === 0) {
        _push(`<div class="text-center py-16 text-gray-500"><p class="text-lg mb-2">No playlists yet</p><p class="text-sm">Create a watch order playlist to help others discover anime in the right order.</p></div>`);
      } else {
        _push(`<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><!--[-->`);
        ssrRenderList(__props.playlists, (playlist) => {
          _push(ssrRenderComponent(_component_Link, {
            key: playlist.id,
            href: _ctx.route("playlists.edit", { playlist: playlist.slug }),
            class: "block bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition group"
          }, {
            default: withCtx((_2, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<div class="flex gap-1 mb-3 h-20 overflow-hidden rounded-lg"${_scopeId}>`);
                if (playlist.cover_images.length > 0) {
                  _push2(`<!--[-->`);
                  ssrRenderList(playlist.cover_images, (src, i2) => {
                    _push2(`<img${ssrRenderAttr("src", src)}${ssrRenderAttr("alt", `Cover ${i2 + 1}`)} class="h-full object-cover flex-1 min-w-0"${_scopeId}>`);
                  });
                  _push2(`<!--]-->`);
                } else {
                  _push2(`<div class="w-full bg-gray-800 flex items-center justify-center text-gray-600 text-sm"${_scopeId}> No anime added </div>`);
                }
                _push2(`</div><h2 class="font-semibold text-gray-100 group-hover:text-primary-400 transition truncate"${_scopeId}>${ssrInterpolate(playlist.title)}</h2><div class="flex items-center gap-2 mt-1 text-xs text-gray-500"${_scopeId}><span${_scopeId}>${ssrInterpolate(playlist.item_count)} anime</span><span${_scopeId}>·</span><span class="${ssrRenderClass(playlist.is_public ? "text-green-500" : "text-gray-500")}"${_scopeId}>${ssrInterpolate(playlist.is_public ? "Public" : "Private")}</span></div>`);
              } else {
                return [
                  createVNode("div", { class: "flex gap-1 mb-3 h-20 overflow-hidden rounded-lg" }, [
                    playlist.cover_images.length > 0 ? (openBlock(true), createBlock(Fragment, { key: 0 }, renderList(playlist.cover_images, (src, i2) => {
                      return openBlock(), createBlock("img", {
                        key: i2,
                        src,
                        alt: `Cover ${i2 + 1}`,
                        class: "h-full object-cover flex-1 min-w-0"
                      }, null, 8, ["src", "alt"]);
                    }), 128)) : (openBlock(), createBlock("div", {
                      key: 1,
                      class: "w-full bg-gray-800 flex items-center justify-center text-gray-600 text-sm"
                    }, " No anime added "))
                  ]),
                  createVNode("h2", { class: "font-semibold text-gray-100 group-hover:text-primary-400 transition truncate" }, toDisplayString(playlist.title), 1),
                  createVNode("div", { class: "flex items-center gap-2 mt-1 text-xs text-gray-500" }, [
                    createVNode("span", null, toDisplayString(playlist.item_count) + " anime", 1),
                    createVNode("span", null, "·"),
                    createVNode("span", {
                      class: playlist.is_public ? "text-green-500" : "text-gray-500"
                    }, toDisplayString(playlist.is_public ? "Public" : "Private"), 3)
                  ])
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div><!--]-->`);
    };
  }
});
const _sfc_setup$i = _sfc_main$i.setup;
_sfc_main$i.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/PlaylistsIndexPage.vue");
  return _sfc_setup$i ? _sfc_setup$i(props, ctx) : void 0;
};
const __vite_glob_0_21 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main$i
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main$h = /* @__PURE__ */ defineComponent({
  ...{ layout: _sfc_main$T },
  __name: "PrivacyPage",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Head = resolveComponent("Head");
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_Head, { title: "Privacy Policy" }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<meta name="description" content="AniTrack Privacy Policy."${_scopeId}><link rel="canonical"${ssrRenderAttr("href", _ctx.route("privacy"))}${_scopeId}>`);
          } else {
            return [
              createVNode("meta", {
                name: "description",
                content: "AniTrack Privacy Policy."
              }),
              createVNode("link", {
                rel: "canonical",
                href: _ctx.route("privacy")
              }, null, 8, ["href"])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div class="mx-auto max-w-3xl space-y-8 py-4"><h1 class="text-3xl font-bold">Privacy Policy</h1><p class="text-sm text-gray-500">Last updated: March 8, 2026</p><section class="space-y-3"><h2 class="text-xl font-semibold text-gray-200">1. Information We Collect</h2><p class="text-gray-400 leading-relaxed">When you create an account, we collect:</p><ul class="list-disc pl-6 space-y-1 text-gray-400"><li><strong class="text-gray-300">Account information:</strong> name, email address, and password</li><li><strong class="text-gray-300">Profile information:</strong> username, bio, timezone, and avatar (optional)</li><li><strong class="text-gray-300">Anime list data:</strong> your watchlist entries, scores, progress, and notes</li><li><strong class="text-gray-300">Error diagnostics:</strong> when errors occur, we may collect your IP address, browser information, and the page you were visiting to help us diagnose and fix issues</li></ul></section><section class="space-y-3"><h2 class="text-xl font-semibold text-gray-200">2. How We Use Your Information</h2><p class="text-gray-400 leading-relaxed">Your information is used to:</p><ul class="list-disc pl-6 space-y-1 text-gray-400"><li>Provide and maintain the AniTrack service</li><li>Display your anime tracking data to you</li><li>Show your public profile and list to other users (if you enable sharing)</li><li>Authenticate your account and secure your data</li></ul><p class="text-gray-400 leading-relaxed"> We do not sell your personal information. We do not use your data for advertising or marketing purposes. </p></section><section class="space-y-3"><h2 class="text-xl font-semibold text-gray-200">3. Cookies</h2><p class="text-gray-400 leading-relaxed">AniTrack uses the following cookies:</p><ul class="list-disc pl-6 space-y-1 text-gray-400"><li><strong class="text-gray-300">Essential cookies:</strong> session cookies to keep you logged in and protect against cross-site request forgery</li><li><strong class="text-gray-300">Analytics cookies:</strong> Google Analytics cookies (e.g. <code class="text-gray-300">_ga</code>, <code class="text-gray-300">_ga_*</code>) to help us understand how visitors use the site. These cookies collect anonymous usage data such as pages visited and session duration</li></ul><p class="text-gray-400 leading-relaxed"> We do not use third-party advertising cookies. </p></section><section class="space-y-3"><h2 class="text-xl font-semibold text-gray-200">4. Third-Party Services</h2><p class="text-gray-400 leading-relaxed">AniTrack uses the following third-party services:</p><ul class="list-disc pl-6 space-y-1 text-gray-400"><li><strong class="text-gray-300">AniList:</strong> we retrieve anime information from the <a href="https://anilist.co" target="_blank" rel="noopener noreferrer" class="text-primary-400 hover:text-primary-300">AniList API</a>. Cover images are served directly from AniList&#39;s CDN.</li><li><strong class="text-gray-300">Google Analytics:</strong> we use <a href="https://marketingplatform.google.com/about/analytics/" target="_blank" rel="noopener noreferrer" class="text-primary-400 hover:text-primary-300">Google Analytics 4</a> to collect anonymous usage statistics. This data helps us understand traffic patterns and improve the site. Google may process this data as described in <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" class="text-primary-400 hover:text-primary-300">Google&#39;s Privacy Policy</a>.</li><li><strong class="text-gray-300">Sentry:</strong> we use <a href="https://sentry.io" target="_blank" rel="noopener noreferrer" class="text-primary-400 hover:text-primary-300">Sentry</a> for error tracking and performance monitoring. When an error occurs, Sentry may receive personally identifiable information including your IP address, browser and OS details, the URL you were visiting, and request data. This data is used solely to diagnose and fix bugs. See <a href="https://sentry.io/privacy/" target="_blank" rel="noopener noreferrer" class="text-primary-400 hover:text-primary-300">Sentry&#39;s Privacy Policy</a> for details.</li></ul><p class="text-gray-400 leading-relaxed"> When you visit AniTrack, your browser may make requests to these external services. </p></section><section class="space-y-3"><h2 class="text-xl font-semibold text-gray-200">5. Data Retention</h2><p class="text-gray-400 leading-relaxed"> Your account data is retained for as long as your account is active. If you delete your account, your data will be soft-deleted and may be permanently removed after a reasonable retention period. Anime list entries you have deleted are soft-deleted and not immediately purged. </p></section><section class="space-y-3"><h2 class="text-xl font-semibold text-gray-200">6. Data Security</h2><p class="text-gray-400 leading-relaxed"> We take reasonable measures to protect your information. Passwords are hashed using industry-standard algorithms. All traffic is encrypted via HTTPS. However, no method of transmission over the internet is 100% secure. </p></section><section class="space-y-3"><h2 class="text-xl font-semibold text-gray-200">7. Your Rights</h2><p class="text-gray-400 leading-relaxed">You have the right to:</p><ul class="list-disc pl-6 space-y-1 text-gray-400"><li>Access your personal data through your account settings</li><li>Update or correct your information at any time</li><li>Export your anime list data</li><li>Delete your account and associated data</li><li>Make your anime list private or public</li></ul></section><section class="space-y-3"><h2 class="text-xl font-semibold text-gray-200">8. Changes to This Policy</h2><p class="text-gray-400 leading-relaxed"> We may update this privacy policy from time to time. Continued use of the service after changes constitutes acceptance of the updated policy. We encourage you to review this page periodically. </p></section></div><!--]-->`);
    };
  }
});
const _sfc_setup$h = _sfc_main$h.setup;
_sfc_main$h.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/PrivacyPage.vue");
  return _sfc_setup$h ? _sfc_setup$h(props, ctx) : void 0;
};
const __vite_glob_0_22 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main$h
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main$g = /* @__PURE__ */ defineComponent({
  ...{ layout: _sfc_main$T },
  __name: "ProfilePage",
  __ssrInlineRender: true,
  props: {
    profile: {},
    stats: {},
    avg_score: {},
    episodes_watched: {}
  },
  setup(__props) {
    const props = __props;
    const memberSince = computed(() => {
      return new Date(props.profile.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    });
    const statuses = ["watching", "completed", "plan_to_watch", "on_hold", "dropped"];
    const totalEntries = computed(() => {
      return Object.values(props.stats).reduce((sum, count) => sum + count, 0);
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Head = resolveComponent("Head");
      const _component_Link = resolveComponent("Link");
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_Head, {
        title: __props.profile.name
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<meta name="description"${ssrRenderAttr("content", __props.profile.bio || `${__props.profile.name}'s anime profile on AniTrack.`)}${_scopeId}><link rel="canonical"${ssrRenderAttr("href", _ctx.route("profile.show", { user: __props.profile.username }))}${_scopeId}><meta property="og:title"${ssrRenderAttr("content", `${__props.profile.name}'s Profile — AniTrack`)}${_scopeId}><meta property="og:description"${ssrRenderAttr("content", __props.profile.bio || `Check out ${__props.profile.name}'s anime profile on AniTrack.`)}${_scopeId}>`);
            if (__props.profile.avatar_url) {
              _push2(`<meta property="og:image"${ssrRenderAttr("content", __props.profile.avatar_url)}${_scopeId}>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<meta property="og:type" content="profile"${_scopeId}><meta name="twitter:card" content="summary"${_scopeId}>`);
          } else {
            return [
              createVNode("meta", {
                name: "description",
                content: __props.profile.bio || `${__props.profile.name}'s anime profile on AniTrack.`
              }, null, 8, ["content"]),
              createVNode("link", {
                rel: "canonical",
                href: _ctx.route("profile.show", { user: __props.profile.username })
              }, null, 8, ["href"]),
              createVNode("meta", {
                property: "og:title",
                content: `${__props.profile.name}'s Profile — AniTrack`
              }, null, 8, ["content"]),
              createVNode("meta", {
                property: "og:description",
                content: __props.profile.bio || `Check out ${__props.profile.name}'s anime profile on AniTrack.`
              }, null, 8, ["content"]),
              __props.profile.avatar_url ? (openBlock(), createBlock("meta", {
                key: 0,
                property: "og:image",
                content: __props.profile.avatar_url
              }, null, 8, ["content"])) : createCommentVNode("", true),
              createVNode("meta", {
                property: "og:type",
                content: "profile"
              }),
              createVNode("meta", {
                name: "twitter:card",
                content: "summary"
              })
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div class="max-w-4xl mx-auto"><div class="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-6"><div class="flex items-center gap-6">`);
      _push(ssrRenderComponent(_sfc_main$W, {
        name: __props.profile.name,
        "avatar-url": __props.profile.avatar_url,
        size: "lg"
      }, null, _parent));
      _push(`<div><h1 class="text-2xl font-bold">${ssrInterpolate(__props.profile.name)}</h1><p class="text-gray-400 text-sm mt-1">Member since ${ssrInterpolate(memberSince.value)}</p>`);
      if (__props.profile.timezone) {
        _push(`<p class="text-gray-500 text-xs mt-1">${ssrInterpolate(__props.profile.timezone)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
      if (__props.profile.bio) {
        _push(`<p class="text-gray-300 mt-4 whitespace-pre-line">${ssrInterpolate(__props.profile.bio)}</p>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.profile.list_is_public) {
        _push(ssrRenderComponent(_component_Link, {
          href: _ctx.route("profile.list", { user: __props.profile.username }),
          class: "text-primary-400 hover:text-primary-300 text-sm mt-3 inline-block"
        }, {
          default: withCtx((_2, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` View Anime List → `);
            } else {
              return [
                createTextVNode(" View Anime List → ")
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="bg-gray-900 border border-gray-800 rounded-xl p-6"><h2 class="text-lg font-semibold mb-4">Anime Stats</h2>`);
      if (totalEntries.value > 0) {
        _push(`<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4"><!--[-->`);
        ssrRenderList(statuses, (status) => {
          _push(`<div class="bg-gray-800 rounded-lg p-4 text-center"><div class="text-2xl font-bold text-primary-400">${ssrInterpolate(__props.stats[status] ?? 0)}</div><div class="text-xs text-gray-400 mt-1">${ssrInterpolate(unref(LIST_STATUS_LABELS)[status])}</div></div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<p class="text-gray-500">No anime in list yet.</p>`);
      }
      if (totalEntries.value > 0) {
        _push(`<div class="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4"><div class="bg-gray-800 rounded-lg p-4 text-center"><div class="text-2xl font-bold text-gray-200">${ssrInterpolate(totalEntries.value)}</div><div class="text-xs text-gray-400 mt-1">Total Entries</div></div><div class="bg-gray-800 rounded-lg p-4 text-center"><div class="text-2xl font-bold text-gray-200">${ssrInterpolate(__props.episodes_watched.toLocaleString())}</div><div class="text-xs text-gray-400 mt-1">Episodes Watched</div></div><div class="bg-gray-800 rounded-lg p-4 text-center"><div class="text-2xl font-bold text-gray-200">${ssrInterpolate(__props.avg_score?.toFixed(1) ?? "-")}</div><div class="text-xs text-gray-400 mt-1">Mean Score</div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><!--]-->`);
    };
  }
});
const _sfc_setup$g = _sfc_main$g.setup;
_sfc_main$g.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/ProfilePage.vue");
  return _sfc_setup$g ? _sfc_setup$g(props, ctx) : void 0;
};
const __vite_glob_0_23 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main$g
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main$f = /* @__PURE__ */ defineComponent({
  __name: "ListStatusTabs",
  __ssrInlineRender: true,
  props: {
    activeStatus: {},
    counts: {}
  },
  emits: ["change"],
  setup(__props, { emit: __emit }) {
    const statuses = ["all", "watching", "completed", "plan_to_watch", "on_hold", "dropped"];
    function label(status) {
      return status === "all" ? "All" : LIST_STATUS_LABELS[status];
    }
    function count(status, counts) {
      if (status === "all") {
        return Object.values(counts).reduce((sum, c2) => sum + c2, 0);
      }
      return counts[status] ?? 0;
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex gap-1 overflow-x-auto border-b border-gray-800 pb-px" }, _attrs))}><!--[-->`);
      ssrRenderList(statuses, (s2) => {
        _push(`<button class="${ssrRenderClass([__props.activeStatus === s2 ? "border-b-2 border-primary-400 text-primary-400" : "text-gray-400 hover:text-gray-200", "flex items-center gap-1.5 whitespace-nowrap px-4 py-2 text-sm font-medium transition"])}">${ssrInterpolate(label(s2))} <span class="text-xs text-gray-500">(${ssrInterpolate(count(s2, __props.counts))})</span></button>`);
      });
      _push(`<!--]--></div>`);
    };
  }
});
const _sfc_setup$f = _sfc_main$f.setup;
_sfc_main$f.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/ListStatusTabs.vue");
  return _sfc_setup$f ? _sfc_setup$f(props, ctx) : void 0;
};
const _sfc_main$e = /* @__PURE__ */ defineComponent({
  __name: "ListTableView",
  __ssrInlineRender: true,
  props: {
    entries: {},
    readonly: { type: Boolean }
  },
  emits: ["update", "delete", "edit"],
  setup(__props, { emit: __emit }) {
    const emit = __emit;
    const statusOptions = Object.entries(LIST_STATUS_LABELS).map(([value, label]) => ({ value, label }));
    function displayTitle(entry) {
      return entry.anime?.title_english || entry.anime?.title_romaji || "Unknown";
    }
    function handleStatusChange(entry, status) {
      emit("update", entry.id, { status });
    }
    function canIncrementProgress(entry) {
      const total = entry.anime?.episodes;
      return total == null || entry.progress < total;
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Link = resolveComponent("Link");
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "overflow-x-auto" }, _attrs))}><table class="w-full text-sm"><thead><tr class="border-b border-gray-800 text-left text-gray-400"><th class="w-12 py-3 pr-2"></th><th class="py-3 pr-4">Title</th><th class="w-40 py-3 pr-4">Status</th><th class="w-20 py-3 pr-4">Score</th><th class="w-32 py-3 pr-4">Progress</th><th class="w-20 py-3 pr-4">Type</th><th class="w-24 py-3">Updated</th></tr></thead><tbody><!--[-->`);
      ssrRenderList(__props.entries, (entry) => {
        _push(`<tr class="border-b border-gray-800/50 hover:bg-gray-900/50 transition"><td class="py-2 pr-2">`);
        if (entry.anime?.cover_image_medium) {
          _push(`<img${ssrRenderAttr("src", entry.anime.cover_image_medium)}${ssrRenderAttr("alt", displayTitle(entry))} class="h-10 w-7 rounded object-cover" loading="lazy">`);
        } else {
          _push(`<!---->`);
        }
        _push(`</td><td class="py-2 pr-4">`);
        if (entry.anime) {
          _push(ssrRenderComponent(_component_Link, {
            href: entry.anime?.slug ? _ctx.route("anime.show", { anime: entry.anime.slug }) : "#",
            class: "text-gray-200 hover:text-primary-400 transition"
          }, {
            default: withCtx((_2, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(displayTitle(entry))}`);
              } else {
                return [
                  createTextVNode(toDisplayString(displayTitle(entry)), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</td><td class="py-2 pr-4">`);
        if (!__props.readonly) {
          _push(ssrRenderComponent(unref(Select), {
            "model-value": entry.status,
            options: unref(statusOptions),
            "option-label": "label",
            "option-value": "value",
            class: "w-full text-xs",
            "onUpdate:modelValue": (v2) => handleStatusChange(entry, v2)
          }, null, _parent));
        } else {
          _push(`<span class="text-gray-300 text-xs">${ssrInterpolate(unref(LIST_STATUS_LABELS)[entry.status])}</span>`);
        }
        _push(`</td><td class="py-2 pr-4">`);
        if (!__props.readonly) {
          _push(`<input type="number" min="0" max="10" step="0.5"${ssrRenderAttr("value", entry.display_score ?? "")} class="w-16 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-center text-gray-200 text-xs">`);
        } else {
          _push(`<span class="text-gray-300 text-xs">${ssrInterpolate(entry.display_score ?? "-")}</span>`);
        }
        _push(`</td><td class="py-2 pr-4"><div class="flex items-center gap-1"><span class="text-gray-300">${ssrInterpolate(entry.progress)}</span><span class="text-gray-500">/</span><span class="text-gray-500">${ssrInterpolate(entry.anime?.episodes ?? "?")}</span>`);
        if (!__props.readonly) {
          _push(`<button class="ml-1 rounded bg-gray-700 px-1.5 py-0.5 text-xs text-gray-300 hover:bg-gray-600 transition disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-gray-700"${ssrIncludeBooleanAttr(!canIncrementProgress(entry)) ? " disabled" : ""}${ssrRenderAttr("title", canIncrementProgress(entry) ? "Add one episode" : "Already at total episode count")}> + </button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></td><td class="py-2 pr-4 text-gray-400">${ssrInterpolate(entry.anime?.format?.replace(/_/g, " ") ?? "-")}</td><td class="py-2 text-gray-500 text-xs">${ssrInterpolate(new Date(entry.updated_at).toLocaleDateString())}</td></tr>`);
      });
      _push(`<!--]--></tbody></table>`);
      if (__props.entries.length === 0) {
        _push(`<p class="py-8 text-center text-gray-500"> No entries found. </p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$e = _sfc_main$e.setup;
_sfc_main$e.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/ListTableView.vue");
  return _sfc_setup$e ? _sfc_setup$e(props, ctx) : void 0;
};
const _sfc_main$d = /* @__PURE__ */ defineComponent({
  __name: "ListCardView",
  __ssrInlineRender: true,
  props: {
    entries: {},
    readonly: { type: Boolean }
  },
  emits: ["edit"],
  setup(__props, { emit: __emit }) {
    function displayTitle(entry) {
      return entry.anime?.title_english || entry.anime?.title_romaji || "Unknown";
    }
    const statusColors = {
      watching: "border-blue-500",
      completed: "border-green-500",
      on_hold: "border-yellow-500",
      dropped: "border-red-500",
      plan_to_watch: "border-gray-600"
    };
    const statusBadgeColors = {
      watching: "bg-blue-500/20 text-blue-400",
      completed: "bg-green-500/20 text-green-400",
      on_hold: "bg-yellow-500/20 text-yellow-400",
      dropped: "bg-red-500/20 text-red-400",
      plan_to_watch: "bg-gray-700 text-gray-400"
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Link = resolveComponent("Link");
      _push(`<!--[--><div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"><!--[-->`);
      ssrRenderList(__props.entries, (entry) => {
        _push(`<div class="${ssrRenderClass([statusColors[entry.status] ?? "border-gray-700", "group relative overflow-hidden rounded-lg bg-gray-800 border-2"])}">`);
        if (entry.anime) {
          _push(ssrRenderComponent(_component_Link, {
            href: entry.anime?.slug ? _ctx.route("anime.show", { anime: entry.anime.slug }) : "#",
            class: "block"
          }, {
            default: withCtx((_2, _push2, _parent2, _scopeId) => {
              if (_push2) {
                if (entry.anime.cover_image_large || entry.anime.cover_image_medium) {
                  _push2(`<img${ssrRenderAttr("src", entry.anime.cover_image_large || entry.anime.cover_image_medium)}${ssrRenderAttr("alt", displayTitle(entry))} class="aspect-[3/4] w-full object-cover" loading="lazy"${_scopeId}>`);
                } else {
                  _push2(`<div class="aspect-[3/4] w-full bg-gray-700 flex items-center justify-center"${_scopeId}><span class="text-gray-500 text-xs"${_scopeId}>No image</span></div>`);
                }
              } else {
                return [
                  entry.anime.cover_image_large || entry.anime.cover_image_medium ? (openBlock(), createBlock("img", {
                    key: 0,
                    src: entry.anime.cover_image_large || entry.anime.cover_image_medium,
                    alt: displayTitle(entry),
                    class: "aspect-[3/4] w-full object-cover",
                    loading: "lazy"
                  }, null, 8, ["src", "alt"])) : (openBlock(), createBlock("div", {
                    key: 1,
                    class: "aspect-[3/4] w-full bg-gray-700 flex items-center justify-center"
                  }, [
                    createVNode("span", { class: "text-gray-500 text-xs" }, "No image")
                  ]))
                ];
              }
            }),
            _: 2
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/95 via-gray-900/70 to-transparent p-2 pt-8"><p class="text-xs font-medium text-gray-200 line-clamp-2 mb-1">${ssrInterpolate(displayTitle(entry))}</p><div class="flex items-center justify-between"><span class="${ssrRenderClass([statusBadgeColors[entry.status] ?? "bg-gray-700 text-gray-400", "text-[10px] px-1.5 py-0.5 rounded-full font-medium"])}">${ssrInterpolate(unref(LIST_STATUS_LABELS)[entry.status])}</span>`);
        if (entry.display_score) {
          _push(`<span class="text-[10px] text-primary-400">${ssrInterpolate(entry.display_score)}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="text-[10px] text-gray-500 mt-0.5">${ssrInterpolate(entry.progress)}${ssrInterpolate(entry.anime?.episodes ? ` / ${entry.anime.episodes}` : "")} eps </div></div>`);
        if (!__props.readonly) {
          _push(`<button class="absolute top-1 right-1 rounded bg-gray-900/80 p-1 text-gray-400 opacity-0 group-hover:opacity-100 transition hover:text-gray-200"><svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      });
      _push(`<!--]--></div>`);
      if (__props.entries.length === 0) {
        _push(`<p class="py-8 text-center text-gray-500"> No entries found. </p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<!--]-->`);
    };
  }
});
const _sfc_setup$d = _sfc_main$d.setup;
_sfc_main$d.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/ListCardView.vue");
  return _sfc_setup$d ? _sfc_setup$d(props, ctx) : void 0;
};
const _sfc_main$c = /* @__PURE__ */ defineComponent({
  __name: "ListCompactView",
  __ssrInlineRender: true,
  props: {
    entries: {},
    readonly: { type: Boolean }
  },
  emits: ["update"],
  setup(__props, { emit: __emit }) {
    const emit = __emit;
    const statusOptions = Object.entries(LIST_STATUS_LABELS).map(([value, label]) => ({ value, label }));
    function displayTitle(entry) {
      return entry.anime?.title_english || entry.anime?.title_romaji || "Unknown";
    }
    function handleStatusChange(entry, status) {
      emit("update", entry.id, { status });
    }
    function canIncrementProgress(entry) {
      const total = entry.anime?.episodes;
      return total == null || entry.progress < total;
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Link = resolveComponent("Link");
      _push(`<!--[--><div class="divide-y divide-gray-800/50"><!--[-->`);
      ssrRenderList(__props.entries, (entry) => {
        _push(`<div class="flex items-center gap-3 py-1.5 hover:bg-gray-900/30 transition text-xs">`);
        if (entry.anime) {
          _push(ssrRenderComponent(_component_Link, {
            href: entry.anime?.slug ? _ctx.route("anime.show", { anime: entry.anime.slug }) : "#",
            class: "flex-1 min-w-0 text-gray-200 hover:text-primary-400 transition truncate"
          }, {
            default: withCtx((_2, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(displayTitle(entry))}`);
              } else {
                return [
                  createTextVNode(toDisplayString(displayTitle(entry)), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        if (!__props.readonly) {
          _push(ssrRenderComponent(unref(Select), {
            "model-value": entry.status,
            options: unref(statusOptions),
            "option-label": "label",
            "option-value": "value",
            class: "w-32 text-xs",
            "onUpdate:modelValue": (v2) => handleStatusChange(entry, v2)
          }, null, _parent));
        } else {
          _push(`<span class="w-32 text-gray-300 text-xs">${ssrInterpolate(unref(LIST_STATUS_LABELS)[entry.status])}</span>`);
        }
        _push(`<span class="w-12 text-center text-gray-400">${ssrInterpolate(entry.display_score ?? "-")}</span><div class="flex items-center gap-1 w-20"><span class="text-gray-300">${ssrInterpolate(entry.progress)}</span><span class="text-gray-600">/${ssrInterpolate(entry.anime?.episodes ?? "?")}</span>`);
        if (!__props.readonly) {
          _push(`<button class="rounded bg-gray-700 px-1 text-gray-300 hover:bg-gray-600 transition disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-gray-700"${ssrIncludeBooleanAttr(!canIncrementProgress(entry)) ? " disabled" : ""}${ssrRenderAttr("title", canIncrementProgress(entry) ? "Add one episode" : "Already at total episode count")}>+</button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><span class="w-16 text-gray-500">${ssrInterpolate(entry.anime?.format?.replace(/_/g, " ") ?? "-")}</span></div>`);
      });
      _push(`<!--]--></div>`);
      if (__props.entries.length === 0) {
        _push(`<p class="py-8 text-center text-gray-500"> No entries found. </p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<!--]-->`);
    };
  }
});
const _sfc_setup$c = _sfc_main$c.setup;
_sfc_main$c.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/ListCompactView.vue");
  return _sfc_setup$c ? _sfc_setup$c(props, ctx) : void 0;
};
const _sfc_main$b = /* @__PURE__ */ defineComponent({
  ...{ layout: _sfc_main$T },
  __name: "PublicListPage",
  __ssrInlineRender: true,
  props: {
    profile: {},
    is_public: { type: Boolean },
    entries: {},
    counts: {}
  },
  setup(__props) {
    const props = __props;
    const activeStatus = ref("all");
    const viewMode = ref("table");
    onMounted(() => {
      const saved = localStorage.getItem("list_view");
      if (saved && ["table", "card", "compact"].includes(saved)) {
        viewMode.value = saved;
      }
    });
    const sortField = ref("-updated_at");
    const filteredEntries = computed(() => {
      let entries = props.entries;
      if (activeStatus.value !== "all") {
        entries = entries.filter((e2) => e2.status === activeStatus.value);
      }
      const [dir, field] = sortField.value.startsWith("-") ? ["desc", sortField.value.slice(1)] : ["asc", sortField.value];
      return [...entries].sort((a2, b2) => {
        let aVal = null;
        let bVal = null;
        if (field === "updated_at") {
          aVal = a2.updated_at;
          bVal = b2.updated_at;
        } else if (field === "score") {
          aVal = a2.score ?? -1;
          bVal = b2.score ?? -1;
        } else if (field === "title") {
          aVal = (a2.anime?.title_english || a2.anime?.title_romaji || "").toLowerCase();
          bVal = (b2.anime?.title_english || b2.anime?.title_romaji || "").toLowerCase();
        } else if (field === "progress") {
          aVal = a2.progress;
          bVal = b2.progress;
        }
        if (aVal === null || bVal === null) return 0;
        if (aVal < bVal) return dir === "asc" ? -1 : 1;
        if (aVal > bVal) return dir === "asc" ? 1 : -1;
        return 0;
      });
    });
    const sortOptions = [
      { label: "Last Updated", value: "-updated_at" },
      { label: "Score", value: "-score" },
      { label: "Title", value: "title" },
      { label: "Progress", value: "-progress" }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Head = resolveComponent("Head");
      const _component_Link = resolveComponent("Link");
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_Head, {
        title: `${__props.profile.name}'s Anime List`
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<meta name="description"${ssrRenderAttr("content", `Browse ${__props.profile.name}'s anime list on AniTrack.`)}${_scopeId}><link rel="canonical"${ssrRenderAttr("href", _ctx.route("profile.list", { user: __props.profile.username }))}${_scopeId}><meta property="og:title"${ssrRenderAttr("content", `${__props.profile.name}'s Anime List — AniTrack`)}${_scopeId}><meta property="og:description"${ssrRenderAttr("content", `Browse ${__props.profile.name}'s anime list on AniTrack.`)}${_scopeId}>`);
            if (__props.profile.avatar_url) {
              _push2(`<meta property="og:image"${ssrRenderAttr("content", __props.profile.avatar_url)}${_scopeId}>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<meta property="og:type" content="website"${_scopeId}><meta name="twitter:card" content="summary"${_scopeId}>`);
          } else {
            return [
              createVNode("meta", {
                name: "description",
                content: `Browse ${__props.profile.name}'s anime list on AniTrack.`
              }, null, 8, ["content"]),
              createVNode("link", {
                rel: "canonical",
                href: _ctx.route("profile.list", { user: __props.profile.username })
              }, null, 8, ["href"]),
              createVNode("meta", {
                property: "og:title",
                content: `${__props.profile.name}'s Anime List — AniTrack`
              }, null, 8, ["content"]),
              createVNode("meta", {
                property: "og:description",
                content: `Browse ${__props.profile.name}'s anime list on AniTrack.`
              }, null, 8, ["content"]),
              __props.profile.avatar_url ? (openBlock(), createBlock("meta", {
                key: 0,
                property: "og:image",
                content: __props.profile.avatar_url
              }, null, 8, ["content"])) : createCommentVNode("", true),
              createVNode("meta", {
                property: "og:type",
                content: "website"
              }),
              createVNode("meta", {
                name: "twitter:card",
                content: "summary"
              })
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div class="space-y-4">`);
      if (!__props.is_public) {
        _push(`<div class="max-w-4xl mx-auto text-center py-16"><h1 class="text-2xl font-bold mb-2">${ssrInterpolate(__props.profile.name)}&#39;s Anime List</h1><p class="text-gray-400">This list is private.</p>`);
        _push(ssrRenderComponent(_component_Link, {
          href: _ctx.route("profile.show", { user: __props.profile.username }),
          class: "text-primary-400 hover:text-primary-300 text-sm mt-4 inline-block"
        }, {
          default: withCtx((_2, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` View profile `);
            } else {
              return [
                createTextVNode(" View profile ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      } else {
        _push(`<!--[--><div class="flex items-center justify-between"><h1 class="text-2xl font-bold">`);
        _push(ssrRenderComponent(_component_Link, {
          href: _ctx.route("profile.show", { user: __props.profile.username }),
          class: "hover:text-primary-400 transition"
        }, {
          default: withCtx((_2, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(__props.profile.name)}`);
            } else {
              return [
                createTextVNode(toDisplayString(__props.profile.name), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`&#39;s Anime List </h1></div>`);
        _push(ssrRenderComponent(_sfc_main$f, {
          "active-status": activeStatus.value,
          counts: __props.counts,
          onChange: ($event) => activeStatus.value = $event
        }, null, _parent));
        _push(`<div class="flex items-center justify-between"><select class="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-gray-300"><!--[-->`);
        ssrRenderList(sortOptions, (opt) => {
          _push(`<option${ssrRenderAttr("value", opt.value)}${ssrIncludeBooleanAttr(Array.isArray(sortField.value) ? ssrLooseContain(sortField.value, opt.value) : ssrLooseEqual(sortField.value, opt.value)) ? " selected" : ""}>${ssrInterpolate(opt.label)}</option>`);
        });
        _push(`<!--]--></select><div class="flex items-center gap-1"><!--[-->`);
        ssrRenderList(["table", "card", "compact"], (mode) => {
          _push(`<button class="${ssrRenderClass([viewMode.value === mode ? "bg-gray-700 text-gray-200" : "text-gray-500 hover:text-gray-300", "rounded px-2 py-1 text-xs transition"])}">${ssrInterpolate(mode.charAt(0).toUpperCase() + mode.slice(1))}</button>`);
        });
        _push(`<!--]--></div></div>`);
        if (viewMode.value === "table") {
          _push(ssrRenderComponent(_sfc_main$e, {
            entries: filteredEntries.value,
            readonly: ""
          }, null, _parent));
        } else if (viewMode.value === "card") {
          _push(ssrRenderComponent(_sfc_main$d, {
            entries: filteredEntries.value,
            readonly: ""
          }, null, _parent));
        } else {
          _push(ssrRenderComponent(_sfc_main$c, {
            entries: filteredEntries.value,
            readonly: ""
          }, null, _parent));
        }
        _push(`<!--]-->`);
      }
      _push(`</div><!--]-->`);
    };
  }
});
const _sfc_setup$b = _sfc_main$b.setup;
_sfc_main$b.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/PublicListPage.vue");
  return _sfc_setup$b ? _sfc_setup$b(props, ctx) : void 0;
};
const __vite_glob_0_24 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main$b
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main$a = /* @__PURE__ */ defineComponent({
  ...{ layout: _sfc_main$T },
  __name: "RegisterPage",
  __ssrInlineRender: true,
  setup(__props) {
    const form = useForm({
      name: "",
      username: "",
      email: "",
      password: "",
      password_confirmation: ""
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Head = resolveComponent("Head");
      const _component_Link = resolveComponent("Link");
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_Head, { title: "Create Account" }, null, _parent));
      _push(`<div class="max-w-md mx-auto mt-16"><h1 class="text-2xl font-bold mb-6">Create Account</h1><form class="space-y-4"><div><label for="name" class="block text-sm text-gray-400 mb-1">Name</label><input id="name"${ssrRenderAttr("value", unref(form).name)} type="text" class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:border-primary-500 focus:outline-none" required autofocus>`);
      if (unref(form).errors.name) {
        _push(`<p class="text-red-400 text-sm mt-1">${ssrInterpolate(unref(form).errors.name)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div><label for="username" class="block text-sm text-gray-400 mb-1">Username</label><input id="username"${ssrRenderAttr("value", unref(form).username)} type="text" class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:border-primary-500 focus:outline-none" required placeholder="letters, numbers, hyphens, underscores">`);
      if (unref(form).errors.username) {
        _push(`<p class="text-red-400 text-sm mt-1">${ssrInterpolate(unref(form).errors.username)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div><label for="email" class="block text-sm text-gray-400 mb-1">Email</label><input id="email"${ssrRenderAttr("value", unref(form).email)} type="email" class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:border-primary-500 focus:outline-none" required>`);
      if (unref(form).errors.email) {
        _push(`<p class="text-red-400 text-sm mt-1">${ssrInterpolate(unref(form).errors.email)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div><label for="password" class="block text-sm text-gray-400 mb-1">Password</label><input id="password"${ssrRenderAttr("value", unref(form).password)} type="password" class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:border-primary-500 focus:outline-none" required>`);
      if (unref(form).errors.password) {
        _push(`<p class="text-red-400 text-sm mt-1">${ssrInterpolate(unref(form).errors.password)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div><label for="password_confirmation" class="block text-sm text-gray-400 mb-1">Confirm Password</label><input id="password_confirmation"${ssrRenderAttr("value", unref(form).password_confirmation)} type="password" class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:border-primary-500 focus:outline-none" required></div><button type="submit"${ssrIncludeBooleanAttr(unref(form).processing) ? " disabled" : ""} class="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg transition disabled:opacity-50"> Sign Up </button></form><p class="text-gray-500 text-sm mt-4 text-center"> Already have an account? `);
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("login"),
        class: "text-primary-400 hover:text-primary-300"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Login`);
          } else {
            return [
              createTextVNode("Login")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</p></div><!--]-->`);
    };
  }
});
const _sfc_setup$a = _sfc_main$a.setup;
_sfc_main$a.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/RegisterPage.vue");
  return _sfc_setup$a ? _sfc_setup$a(props, ctx) : void 0;
};
const __vite_glob_0_25 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main$a
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main$9 = /* @__PURE__ */ defineComponent({
  __name: "ScheduleDayColumn",
  __ssrInlineRender: true,
  props: {
    utcDate: {},
    slots: {},
    isToday: { type: Boolean }
  },
  setup(__props) {
    const props = __props;
    const page = usePage();
    const timezone = computed(() => page.props.auth?.user?.timezone);
    const { formatCountdown, formatLocalTime, formatLocalDate } = useCountdown();
    const dayLabel = computed(() => {
      if (!props.slots.length) {
        return (/* @__PURE__ */ new Date(props.utcDate + "T12:00:00Z")).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          timeZone: timezone.value
        });
      }
      return formatLocalDate(props.slots[0].airs_at, timezone.value);
    });
    const validSlots = computed(() => props.slots.filter((s2) => s2.anime !== null));
    function displayTitle(slot) {
      return slot.anime.title_english || slot.anime.title_romaji || "Unknown";
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Link = resolveComponent("Link");
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex flex-col gap-2" }, _attrs))}><div class="${ssrRenderClass([__props.isToday ? "bg-primary-600/20 text-primary-400 border border-primary-600/40" : "bg-gray-900 text-gray-400", "rounded-lg px-3 py-2 text-center text-sm font-semibold"])}">${ssrInterpolate(dayLabel.value)} `);
      if (__props.isToday) {
        _push(`<span class="ml-1 text-xs">(Today)</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (validSlots.value.length) {
        _push(`<div class="space-y-2"><!--[-->`);
        ssrRenderList(validSlots.value, (slot) => {
          _push(ssrRenderComponent(_component_Link, {
            key: slot.id,
            href: slot.anime.slug ? _ctx.route("anime.show", { anime: slot.anime.slug }) : "#",
            class: "group flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900/50 p-2 transition hover:border-gray-700 hover:bg-gray-900"
          }, {
            default: withCtx((_2, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<div class="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-gray-800"${_scopeId}>`);
                if (slot.anime.cover_image_medium) {
                  _push2(`<img${ssrRenderAttr("src", slot.anime.cover_image_medium)}${ssrRenderAttr("alt", displayTitle(slot))} class="h-full w-full object-cover" loading="lazy"${_scopeId}>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div><div class="min-w-0 flex-1"${_scopeId}><p class="line-clamp-2 text-xs font-medium text-gray-200 group-hover:text-primary-400 transition"${_scopeId}>${ssrInterpolate(displayTitle(slot))}</p><p class="mt-0.5 text-[10px] text-gray-500"${_scopeId}> EP ${ssrInterpolate(slot.episode)} · ${ssrInterpolate(unref(formatLocalTime)(slot.airs_at, timezone.value))}</p><p class="text-[10px] font-medium text-primary-400"${_scopeId}>${ssrInterpolate(unref(formatCountdown)(slot.airs_at))}</p></div>`);
                _push2(ssrRenderComponent(_sfc_main$H, {
                  score: slot.anime.average_score,
                  size: "sm",
                  class: "shrink-0"
                }, null, _parent2, _scopeId));
              } else {
                return [
                  createVNode("div", { class: "h-14 w-10 shrink-0 overflow-hidden rounded-md bg-gray-800" }, [
                    slot.anime.cover_image_medium ? (openBlock(), createBlock("img", {
                      key: 0,
                      src: slot.anime.cover_image_medium,
                      alt: displayTitle(slot),
                      class: "h-full w-full object-cover",
                      loading: "lazy"
                    }, null, 8, ["src", "alt"])) : createCommentVNode("", true)
                  ]),
                  createVNode("div", { class: "min-w-0 flex-1" }, [
                    createVNode("p", { class: "line-clamp-2 text-xs font-medium text-gray-200 group-hover:text-primary-400 transition" }, toDisplayString(displayTitle(slot)), 1),
                    createVNode("p", { class: "mt-0.5 text-[10px] text-gray-500" }, " EP " + toDisplayString(slot.episode) + " · " + toDisplayString(unref(formatLocalTime)(slot.airs_at, timezone.value)), 1),
                    createVNode("p", { class: "text-[10px] font-medium text-primary-400" }, toDisplayString(unref(formatCountdown)(slot.airs_at)), 1)
                  ]),
                  createVNode(_sfc_main$H, {
                    score: slot.anime.average_score,
                    size: "sm",
                    class: "shrink-0"
                  }, null, 8, ["score"])
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<div class="rounded-lg border border-gray-800/50 py-6 text-center text-xs text-gray-600"> No episodes </div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$9 = _sfc_main$9.setup;
_sfc_main$9.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/ScheduleDayColumn.vue");
  return _sfc_setup$9 ? _sfc_setup$9(props, ctx) : void 0;
};
const _sfc_main$8 = /* @__PURE__ */ defineComponent({
  ...{ layout: _sfc_main$T },
  __name: "SchedulePage",
  __ssrInlineRender: true,
  props: {
    days: {},
    weekOffset: {},
    weekStart: {},
    weekEnd: {},
    myListOnly: { type: Boolean },
    isAuth: { type: Boolean }
  },
  setup(__props) {
    const props = __props;
    const orderedDays = computed(() => {
      const result = [];
      const todayUtc = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      for (let i2 = 0; i2 < 7; i2++) {
        const d2 = new Date(props.weekStart);
        d2.setUTCDate(d2.getUTCDate() + i2);
        const utcDate = d2.toISOString().slice(0, 10);
        result.push({
          utcDate,
          isToday: utcDate === todayUtc
        });
      }
      return result;
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Head = resolveComponent("Head");
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_Head, { title: "Airing Schedule" }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<meta name="description" content="See what anime is airing this week on AniTrack."${_scopeId}><link rel="canonical"${ssrRenderAttr("href", _ctx.route("schedule"))}${_scopeId}>`);
          } else {
            return [
              createVNode("meta", {
                name: "description",
                content: "See what anime is airing this week on AniTrack."
              }),
              createVNode("link", {
                rel: "canonical",
                href: _ctx.route("schedule")
              }, null, 8, ["href"])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div class="space-y-6"><div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h1 class="text-2xl font-bold text-gray-100">Airing Schedule</h1><div class="flex items-center gap-3">`);
      if (__props.isAuth) {
        _push(`<button class="${ssrRenderClass([__props.myListOnly ? "border-primary-500 bg-primary-600/20 text-primary-400" : "border-gray-700 bg-gray-900 text-gray-400 hover:text-gray-200", "rounded-lg border px-3 py-1.5 text-sm transition"])}"> My List </button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="flex items-center gap-1"><button${ssrIncludeBooleanAttr(__props.weekOffset === 0) ? " disabled" : ""} class="rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm text-gray-400 transition hover:text-gray-200 disabled:cursor-not-allowed disabled:opacity-40"> This Week </button><button${ssrIncludeBooleanAttr(__props.weekOffset === 1) ? " disabled" : ""} class="rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm text-gray-400 transition hover:text-gray-200 disabled:cursor-not-allowed disabled:opacity-40"> Next Week </button></div></div></div><div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7"><!--[-->`);
      ssrRenderList(orderedDays.value, (day) => {
        _push(ssrRenderComponent(_sfc_main$9, {
          key: day.utcDate,
          "utc-date": day.utcDate,
          slots: __props.days[day.utcDate] ?? [],
          "is-today": day.isToday
        }, null, _parent));
      });
      _push(`<!--]--></div>`);
      if (!Object.keys(__props.days).length) {
        _push(`<div class="py-16 text-center text-gray-500"><p>No episodes scheduled for this week.</p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><!--]-->`);
    };
  }
});
const _sfc_setup$8 = _sfc_main$8.setup;
_sfc_main$8.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/SchedulePage.vue");
  return _sfc_setup$8 ? _sfc_setup$8(props, ctx) : void 0;
};
const __vite_glob_0_26 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main$8
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main$7 = /* @__PURE__ */ defineComponent({
  __name: "SeasonSelector",
  __ssrInlineRender: true,
  props: {
    year: {},
    season: {},
    adjacentSeasons: {}
  },
  setup(__props) {
    function seasonLabel(season) {
      return season.charAt(0) + season.slice(1).toLowerCase();
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Link = resolveComponent("Link");
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex items-center gap-4" }, _attrs))}>`);
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("seasonal", { year: __props.adjacentSeasons.previous.year, season: __props.adjacentSeasons.previous.season.toLowerCase() }),
        class: "rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-400 transition hover:bg-gray-800 hover:text-gray-200"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` ← ${ssrInterpolate(seasonLabel(__props.adjacentSeasons.previous.season))} ${ssrInterpolate(__props.adjacentSeasons.previous.year)}`);
          } else {
            return [
              createTextVNode(" ← " + toDisplayString(seasonLabel(__props.adjacentSeasons.previous.season)) + " " + toDisplayString(__props.adjacentSeasons.previous.year), 1)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<h2 class="text-xl font-bold text-gray-100">${ssrInterpolate(seasonLabel(__props.season))} ${ssrInterpolate(__props.year)}</h2>`);
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("seasonal", { year: __props.adjacentSeasons.next.year, season: __props.adjacentSeasons.next.season.toLowerCase() }),
        class: "rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-400 transition hover:bg-gray-800 hover:text-gray-200"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`${ssrInterpolate(seasonLabel(__props.adjacentSeasons.next.season))} ${ssrInterpolate(__props.adjacentSeasons.next.year)} → `);
          } else {
            return [
              createTextVNode(toDisplayString(seasonLabel(__props.adjacentSeasons.next.season)) + " " + toDisplayString(__props.adjacentSeasons.next.year) + " → ", 1)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup$7 = _sfc_main$7.setup;
_sfc_main$7.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Components/SeasonSelector.vue");
  return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
const _sfc_main$6 = /* @__PURE__ */ defineComponent({
  ...{ layout: _sfc_main$T },
  __name: "SeasonalPage",
  __ssrInlineRender: true,
  props: {
    groups: {},
    year: {},
    season: {},
    adjacentSeasons: {}
  },
  setup(__props) {
    function seasonLabel(season) {
      return season.charAt(0) + season.slice(1).toLowerCase();
    }
    function formatLabel(format) {
      if (format === "OTHER") return "Other";
      return format.replace(/_/g, " ");
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Head = resolveComponent("Head");
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_Head, {
        title: `${seasonLabel(__props.season)} ${__props.year} Anime`
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<meta name="description"${ssrRenderAttr("content", `Browse all anime airing in ${seasonLabel(__props.season)} ${__props.year}.`)}${_scopeId}><link rel="canonical"${ssrRenderAttr("href", _ctx.route("seasonal"))}${_scopeId}><meta property="og:title"${ssrRenderAttr("content", `${seasonLabel(__props.season)} ${__props.year} Anime — AniTrack`)}${_scopeId}><meta property="og:description"${ssrRenderAttr("content", `Browse all anime airing in ${seasonLabel(__props.season)} ${__props.year}.`)}${_scopeId}><meta property="og:type" content="website"${_scopeId}><meta name="twitter:card" content="summary"${_scopeId}>`);
          } else {
            return [
              createVNode("meta", {
                name: "description",
                content: `Browse all anime airing in ${seasonLabel(__props.season)} ${__props.year}.`
              }, null, 8, ["content"]),
              createVNode("link", {
                rel: "canonical",
                href: _ctx.route("seasonal")
              }, null, 8, ["href"]),
              createVNode("meta", {
                property: "og:title",
                content: `${seasonLabel(__props.season)} ${__props.year} Anime — AniTrack`
              }, null, 8, ["content"]),
              createVNode("meta", {
                property: "og:description",
                content: `Browse all anime airing in ${seasonLabel(__props.season)} ${__props.year}.`
              }, null, 8, ["content"]),
              createVNode("meta", {
                property: "og:type",
                content: "website"
              }),
              createVNode("meta", {
                name: "twitter:card",
                content: "summary"
              })
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div class="space-y-8"><div class="flex flex-col items-center gap-4"><h1 class="text-3xl font-bold text-gray-100">Seasonal Anime</h1>`);
      _push(ssrRenderComponent(_sfc_main$7, {
        year: __props.year,
        season: __props.season,
        "adjacent-seasons": __props.adjacentSeasons
      }, null, _parent));
      _push(`</div>`);
      if (__props.groups.length) {
        _push(`<div class="space-y-10"><!--[-->`);
        ssrRenderList(__props.groups, (group) => {
          _push(`<section><h2 class="mb-4 text-xl font-semibold text-gray-200">${ssrInterpolate(formatLabel(group.format))} <span class="ml-2 text-sm font-normal text-gray-500">(${ssrInterpolate(group.anime.length)})</span></h2><div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"><!--[-->`);
          ssrRenderList(group.anime, (anime) => {
            _push(ssrRenderComponent(_sfc_main$C, {
              key: anime.id ?? anime.anilist_id,
              anime,
              "view-mode": "grid"
            }, null, _parent));
          });
          _push(`<!--]--></div></section>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<div class="py-16 text-center"><p class="text-gray-500">No anime found for this season.</p></div>`);
      }
      _push(`</div><!--]-->`);
    };
  }
});
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/SeasonalPage.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const __vite_glob_0_27 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main$6
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main$5 = /* @__PURE__ */ defineComponent({
  ...{ layout: _sfc_main$T },
  __name: "SettingsPage",
  __ssrInlineRender: true,
  props: {
    timezones: {},
    publicApiEnabled: { type: Boolean },
    apiTokens: {},
    passkeys: {}
  },
  setup(__props) {
    const props = __props;
    const page = usePage();
    const user = computed(() => page.props.auth.user);
    const profileForm = useForm({
      name: user.value.name,
      username: user.value.username,
      email: user.value.email,
      bio: user.value.bio ?? "",
      timezone: user.value.timezone,
      avatar_url: user.value.avatar_url ?? "",
      list_is_public: user.value.list_is_public ?? false
    });
    const passwordForm = useForm({
      current_password: "",
      password: "",
      password_confirmation: ""
    });
    const timezoneOptions = computed(
      () => props.timezones.map((tz) => ({ label: tz, value: tz }))
    );
    const tokenForm = useForm({ name: "" });
    const justCreatedToken = ref(null);
    const revokingId = ref(null);
    watch(
      () => page.props.flash.newApiToken,
      (token) => {
        if (token) {
          justCreatedToken.value = token;
        }
      },
      { immediate: true }
    );
    function revokeToken(token) {
      const confirmed = window.confirm(
        `Revoke "${token.name}"? Any clients using this token will stop working immediately.`
      );
      if (!confirmed) return;
      revokingId.value = token.id;
      router.delete(route("settings.api-tokens.destroy", { token: token.id }), {
        preserveScroll: true,
        onFinish: () => {
          revokingId.value = null;
        }
      });
    }
    function dismissNewToken() {
      justCreatedToken.value = null;
    }
    function copyToken(value) {
      void navigator.clipboard?.writeText(value);
    }
    function formatWhen(iso) {
      if (!iso) return "never";
      return new Date(iso).toLocaleString();
    }
    const passkeySupported = ref(false);
    const passkeyError = ref(null);
    const passkeyBusy = ref(false);
    const passkeyAlias = ref("");
    const passkeyDeletingId = ref(null);
    onMounted(() => {
      passkeySupported.value = Webpass.isSupported();
    });
    function deletePasskey(passkey) {
      if (!window.confirm(`Remove "${passkey.alias}"? You won't be able to sign in with this passkey anymore.`)) {
        return;
      }
      passkeyDeletingId.value = passkey.id;
      router.delete(route("settings.passkeys.destroy", { passkey: passkey.id }), {
        preserveScroll: true,
        onFinish: () => {
          passkeyDeletingId.value = null;
        }
      });
    }
    function summariseUserAgent(ua) {
      if (!ua) return "Unknown device";
      if (/Chrome\/\S+/.test(ua) && /AniTrack/i.test(ua)) return "AniTrack Chrome Extension";
      if (/Chrome\/\S+/.test(ua)) return "Chrome";
      if (/Firefox\/\S+/.test(ua)) return "Firefox";
      if (/Safari\/\S+/.test(ua) && !/Chrome/.test(ua)) return "Safari";
      if (/curl\/\S+/i.test(ua)) return "curl";
      if (/PostmanRuntime/i.test(ua)) return "Postman";
      return ua.slice(0, 60);
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Head = resolveComponent("Head");
      const _component_Link = resolveComponent("Link");
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_Head, { title: "Settings" }, null, _parent));
      _push(`<div class="max-w-2xl mx-auto space-y-8"><h1 class="text-2xl font-bold">Settings</h1>`);
      if (unref(page).props.flash.message) {
        _push(`<div class="bg-green-900/50 border border-green-700 text-green-300 px-4 py-3 rounded-lg">${ssrInterpolate(unref(page).props.flash.message)}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="bg-gray-900 border border-gray-800 rounded-xl p-6"><h2 class="text-lg font-semibold mb-4">Profile</h2><form class="space-y-4"><div><label class="block text-sm text-gray-400 mb-1">Name</label>`);
      _push(ssrRenderComponent(unref(InputText), {
        modelValue: unref(profileForm).name,
        "onUpdate:modelValue": ($event) => unref(profileForm).name = $event,
        class: "w-full",
        invalid: !!unref(profileForm).errors.name
      }, null, _parent));
      if (unref(profileForm).errors.name) {
        _push(`<p class="text-red-400 text-sm mt-1">${ssrInterpolate(unref(profileForm).errors.name)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div><label class="block text-sm text-gray-400 mb-1">Username</label>`);
      _push(ssrRenderComponent(unref(InputText), {
        modelValue: unref(profileForm).username,
        "onUpdate:modelValue": ($event) => unref(profileForm).username = $event,
        class: "w-full",
        invalid: !!unref(profileForm).errors.username
      }, null, _parent));
      _push(`<p class="text-gray-500 text-xs mt-1">Your profile URL: /user/${ssrInterpolate(unref(profileForm).username || "...")}</p>`);
      if (unref(profileForm).errors.username) {
        _push(`<p class="text-red-400 text-sm mt-1">${ssrInterpolate(unref(profileForm).errors.username)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div><label class="block text-sm text-gray-400 mb-1">Email</label>`);
      _push(ssrRenderComponent(unref(InputText), {
        modelValue: unref(profileForm).email,
        "onUpdate:modelValue": ($event) => unref(profileForm).email = $event,
        type: "email",
        class: "w-full",
        invalid: !!unref(profileForm).errors.email
      }, null, _parent));
      if (unref(profileForm).errors.email) {
        _push(`<p class="text-red-400 text-sm mt-1">${ssrInterpolate(unref(profileForm).errors.email)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div><label class="block text-sm text-gray-400 mb-1">Bio</label>`);
      _push(ssrRenderComponent(unref(Textarea), {
        modelValue: unref(profileForm).bio,
        "onUpdate:modelValue": ($event) => unref(profileForm).bio = $event,
        rows: "3",
        class: "w-full",
        invalid: !!unref(profileForm).errors.bio
      }, null, _parent));
      if (unref(profileForm).errors.bio) {
        _push(`<p class="text-red-400 text-sm mt-1">${ssrInterpolate(unref(profileForm).errors.bio)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div><label class="block text-sm text-gray-400 mb-1">Timezone</label>`);
      _push(ssrRenderComponent(unref(Select), {
        modelValue: unref(profileForm).timezone,
        "onUpdate:modelValue": ($event) => unref(profileForm).timezone = $event,
        options: timezoneOptions.value,
        "option-label": "label",
        "option-value": "value",
        filter: "",
        class: "w-full",
        invalid: !!unref(profileForm).errors.timezone
      }, null, _parent));
      if (unref(profileForm).errors.timezone) {
        _push(`<p class="text-red-400 text-sm mt-1">${ssrInterpolate(unref(profileForm).errors.timezone)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div><label class="block text-sm text-gray-400 mb-1">Avatar URL</label>`);
      _push(ssrRenderComponent(unref(InputText), {
        modelValue: unref(profileForm).avatar_url,
        "onUpdate:modelValue": ($event) => unref(profileForm).avatar_url = $event,
        class: "w-full",
        placeholder: "https://example.com/avatar.jpg",
        invalid: !!unref(profileForm).errors.avatar_url
      }, null, _parent));
      if (unref(profileForm).errors.avatar_url) {
        _push(`<p class="text-red-400 text-sm mt-1">${ssrInterpolate(unref(profileForm).errors.avatar_url)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="flex items-center gap-3">`);
      _push(ssrRenderComponent(unref(ToggleSwitch), {
        modelValue: unref(profileForm).list_is_public,
        "onUpdate:modelValue": ($event) => unref(profileForm).list_is_public = $event
      }, null, _parent));
      _push(`<label class="text-sm text-gray-400">Make my anime list public</label></div>`);
      _push(ssrRenderComponent(unref(Button), {
        type: "submit",
        label: "Save Profile",
        loading: unref(profileForm).processing,
        disabled: unref(profileForm).processing
      }, null, _parent));
      _push(`</form></div><div class="bg-gray-900 border border-gray-800 rounded-xl p-6"><h2 class="text-lg font-semibold mb-4">Change Password</h2><form class="space-y-4"><div><label class="block text-sm text-gray-400 mb-1">Current Password</label>`);
      _push(ssrRenderComponent(unref(Password), {
        modelValue: unref(passwordForm).current_password,
        "onUpdate:modelValue": ($event) => unref(passwordForm).current_password = $event,
        feedback: false,
        "toggle-mask": "",
        class: "w-full",
        "input-class": "w-full",
        invalid: !!unref(passwordForm).errors.current_password
      }, null, _parent));
      if (unref(passwordForm).errors.current_password) {
        _push(`<p class="text-red-400 text-sm mt-1">${ssrInterpolate(unref(passwordForm).errors.current_password)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div><label class="block text-sm text-gray-400 mb-1">New Password</label>`);
      _push(ssrRenderComponent(unref(Password), {
        modelValue: unref(passwordForm).password,
        "onUpdate:modelValue": ($event) => unref(passwordForm).password = $event,
        feedback: false,
        "toggle-mask": "",
        class: "w-full",
        "input-class": "w-full",
        invalid: !!unref(passwordForm).errors.password
      }, null, _parent));
      if (unref(passwordForm).errors.password) {
        _push(`<p class="text-red-400 text-sm mt-1">${ssrInterpolate(unref(passwordForm).errors.password)}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div><label class="block text-sm text-gray-400 mb-1">Confirm New Password</label>`);
      _push(ssrRenderComponent(unref(Password), {
        modelValue: unref(passwordForm).password_confirmation,
        "onUpdate:modelValue": ($event) => unref(passwordForm).password_confirmation = $event,
        feedback: false,
        "toggle-mask": "",
        class: "w-full",
        "input-class": "w-full"
      }, null, _parent));
      _push(`</div>`);
      _push(ssrRenderComponent(unref(Button), {
        type: "submit",
        label: "Change Password",
        severity: "secondary",
        loading: unref(passwordForm).processing,
        disabled: unref(passwordForm).processing
      }, null, _parent));
      _push(`</form></div><div class="bg-gray-900 border border-gray-800 rounded-xl p-6"><h2 class="text-lg font-semibold mb-1">Passkeys</h2><p class="text-sm text-gray-400 mb-4"> Sign in without a password using a security key (e.g. YubiKey), your device&#39;s biometrics, or another authenticator. </p>`);
      if (!passkeySupported.value) {
        _push(`<div class="text-sm text-amber-300 bg-amber-950/40 border border-amber-800 rounded-lg p-3 mb-4"> Your browser doesn&#39;t support passkeys. Try the latest Chrome, Firefox, or Safari. </div>`);
      } else {
        _push(`<form class="flex gap-2 mb-6"><div class="flex-1">`);
        _push(ssrRenderComponent(unref(InputText), {
          modelValue: passkeyAlias.value,
          "onUpdate:modelValue": ($event) => passkeyAlias.value = $event,
          placeholder: "e.g. YubiKey 5C, MacBook Touch ID",
          class: "w-full",
          disabled: passkeyBusy.value
        }, null, _parent));
        _push(`</div>`);
        _push(ssrRenderComponent(unref(Button), {
          type: "submit",
          label: passkeyBusy.value ? "Waiting for passkey…" : "Add passkey",
          loading: passkeyBusy.value,
          disabled: passkeyBusy.value
        }, null, _parent));
        _push(`</form>`);
      }
      if (passkeyError.value) {
        _push(`<p class="text-red-400 text-sm mb-4">${ssrInterpolate(passkeyError.value)}</p>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.passkeys.length === 0) {
        _push(`<div class="text-sm text-gray-500"> No passkeys yet. Add one above to enable passwordless sign-in. </div>`);
      } else {
        _push(`<ul class="divide-y divide-gray-800"><!--[-->`);
        ssrRenderList(__props.passkeys, (passkey) => {
          _push(`<li class="py-3 flex items-start justify-between gap-3"><div class="min-w-0 flex-1"><div class="font-medium truncate">${ssrInterpolate(passkey.alias)}</div><div class="text-xs text-gray-600 mt-0.5"> Added ${ssrInterpolate(formatWhen(passkey.created_at))}</div></div>`);
          _push(ssrRenderComponent(unref(Button), {
            type: "button",
            size: "small",
            label: "Remove",
            severity: "danger",
            outlined: "",
            loading: passkeyDeletingId.value === passkey.id,
            disabled: passkeyDeletingId.value === passkey.id,
            onClick: ($event) => deletePasskey(passkey)
          }, null, _parent));
          _push(`</li>`);
        });
        _push(`<!--]--></ul>`);
      }
      _push(`</div>`);
      if (__props.publicApiEnabled) {
        _push(`<div class="bg-gray-900 border border-gray-800 rounded-xl p-6"><h2 class="text-lg font-semibold mb-1">API Tokens</h2><p class="text-sm text-gray-400 mb-4"> Issue tokens for third-party integrations. Each token can read and modify your list on your behalf — treat them like passwords. See the `);
        _push(ssrRenderComponent(_component_Link, {
          href: _ctx.route("developers"),
          class: "text-emerald-400 hover:underline"
        }, {
          default: withCtx((_2, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`developer docs`);
            } else {
              return [
                createTextVNode("developer docs")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(` for endpoint details. </p>`);
        if (justCreatedToken.value) {
          _push(`<div class="bg-amber-950/40 border border-amber-800 rounded-lg p-4 mb-4"><div class="flex items-start justify-between gap-3"><div class="min-w-0 flex-1"><p class="text-amber-300 text-sm font-medium mb-1"> Copy your token now — you won&#39;t be able to see it again. </p><p class="text-gray-400 text-xs mb-2"><strong>${ssrInterpolate(justCreatedToken.value.name)}</strong></p><code class="block w-full break-all bg-gray-950 border border-gray-800 rounded px-3 py-2 text-sm font-mono text-amber-200">${ssrInterpolate(justCreatedToken.value.plain_text)}</code></div><div class="flex flex-col gap-2 shrink-0">`);
          _push(ssrRenderComponent(unref(Button), {
            type: "button",
            size: "small",
            label: "Copy",
            severity: "secondary",
            onClick: ($event) => copyToken(justCreatedToken.value.plain_text)
          }, null, _parent));
          _push(ssrRenderComponent(unref(Button), {
            type: "button",
            size: "small",
            label: "Dismiss",
            severity: "secondary",
            text: "",
            onClick: dismissNewToken
          }, null, _parent));
          _push(`</div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<form class="flex gap-2 mb-6"><div class="flex-1">`);
        _push(ssrRenderComponent(unref(InputText), {
          modelValue: unref(tokenForm).name,
          "onUpdate:modelValue": ($event) => unref(tokenForm).name = $event,
          placeholder: "e.g. Chrome Extension — Work Laptop",
          class: "w-full",
          invalid: !!unref(tokenForm).errors.name
        }, null, _parent));
        if (unref(tokenForm).errors.name) {
          _push(`<p class="text-red-400 text-sm mt-1">${ssrInterpolate(unref(tokenForm).errors.name)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        _push(ssrRenderComponent(unref(Button), {
          type: "submit",
          label: "Create Token",
          loading: unref(tokenForm).processing,
          disabled: unref(tokenForm).processing || unref(tokenForm).name.trim().length === 0
        }, null, _parent));
        _push(`</form>`);
        if (__props.apiTokens.length === 0) {
          _push(`<div class="text-sm text-gray-500"> No tokens yet. Create one above to get started. </div>`);
        } else {
          _push(`<ul class="divide-y divide-gray-800"><!--[-->`);
          ssrRenderList(__props.apiTokens, (token) => {
            _push(`<li class="py-3 flex items-start justify-between gap-3"><div class="min-w-0 flex-1"><div class="flex items-center gap-2"><span class="font-medium truncate">${ssrInterpolate(token.name)}</span></div><div class="text-xs text-gray-500 mt-1 space-x-2"><span>Last used: ${ssrInterpolate(formatWhen(token.last_used_at))}</span>`);
            if (token.last_used_ip) {
              _push(`<span>· from ${ssrInterpolate(token.last_used_ip)}</span>`);
            } else {
              _push(`<!---->`);
            }
            if (token.last_used_user_agent) {
              _push(`<span> · ${ssrInterpolate(summariseUserAgent(token.last_used_user_agent))}</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div><div class="text-xs text-gray-600 mt-0.5"> Created ${ssrInterpolate(formatWhen(token.created_at))}</div></div>`);
            _push(ssrRenderComponent(unref(Button), {
              type: "button",
              size: "small",
              label: "Revoke",
              severity: "danger",
              outlined: "",
              loading: revokingId.value === token.id,
              disabled: revokingId.value === token.id,
              onClick: ($event) => revokeToken(token)
            }, null, _parent));
            _push(`</li>`);
          });
          _push(`<!--]--></ul>`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><!--]-->`);
    };
  }
});
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/SettingsPage.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const __vite_glob_0_28 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main$5
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  ...{ layout: _sfc_main$T },
  __name: "StudioDetailPage",
  __ssrInlineRender: true,
  props: {
    studio: {},
    anime: {},
    og: {},
    kind: {}
  },
  setup(__props) {
    const props = __props;
    const labels = computed(() => props.kind === "producer" ? {
      breadcrumbText: "Producers",
      breadcrumbRoute: "producers.index",
      kindLabel: "Producer",
      emptyMessage: "No anime found for this producer."
    } : {
      breadcrumbText: "Studios",
      breadcrumbRoute: "studios.index",
      kindLabel: "Animation studio",
      emptyMessage: "No anime found for this studio."
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Head = resolveComponent("Head");
      const _component_Link = resolveComponent("Link");
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_Head, {
        title: __props.studio.name
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<meta name="description"${ssrRenderAttr("content", __props.og.description)}${_scopeId}><link rel="canonical"${ssrRenderAttr("href", __props.og.url)}${_scopeId}><meta property="og:title"${ssrRenderAttr("content", __props.og.title)}${_scopeId}><meta property="og:description"${ssrRenderAttr("content", __props.og.description)}${_scopeId}><meta property="og:url"${ssrRenderAttr("content", __props.og.url)}${_scopeId}><meta property="og:type" content="website"${_scopeId}>`);
          } else {
            return [
              createVNode("meta", {
                name: "description",
                content: __props.og.description
              }, null, 8, ["content"]),
              createVNode("link", {
                rel: "canonical",
                href: __props.og.url
              }, null, 8, ["href"]),
              createVNode("meta", {
                property: "og:title",
                content: __props.og.title
              }, null, 8, ["content"]),
              createVNode("meta", {
                property: "og:description",
                content: __props.og.description
              }, null, 8, ["content"]),
              createVNode("meta", {
                property: "og:url",
                content: __props.og.url
              }, null, 8, ["content"]),
              createVNode("meta", {
                property: "og:type",
                content: "website"
              })
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div><div class="mb-6"><div class="text-sm text-gray-500">`);
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route(labels.value.breadcrumbRoute),
        class: "text-primary-400 hover:text-primary-300"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`${ssrInterpolate(labels.value.breadcrumbText)}`);
          } else {
            return [
              createTextVNode(toDisplayString(labels.value.breadcrumbText), 1)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<span class="mx-2 text-gray-600">/</span><span>${ssrInterpolate(__props.studio.name)}</span></div><h1 class="mt-2 text-2xl font-bold text-gray-100 md:text-3xl">${ssrInterpolate(__props.studio.name)}</h1><p class="mt-1 text-sm text-gray-400">${ssrInterpolate(labels.value.kindLabel)} · ${ssrInterpolate(__props.studio.anime_count.toLocaleString())} anime </p>`);
      if (__props.studio.website_url) {
        _push(`<a${ssrRenderAttr("href", __props.studio.website_url)} target="_blank" rel="noopener noreferrer" class="mt-2 inline-block text-sm text-primary-400 hover:text-primary-300"> Official website → </a>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (__props.anime.data.length) {
        _push(`<div><div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"><!--[-->`);
        ssrRenderList(__props.anime.data, (item) => {
          _push(ssrRenderComponent(_sfc_main$C, {
            key: item.id ?? item.anilist_id,
            anime: item,
            "view-mode": "grid"
          }, null, _parent));
        });
        _push(`<!--]--></div><div class="mt-8">`);
        _push(ssrRenderComponent(_sfc_main$Q, {
          "current-page": __props.anime.meta.current_page,
          "last-page": __props.anime.meta.last_page,
          total: __props.anime.meta.total
        }, null, _parent));
        _push(`</div></div>`);
      } else {
        _push(`<div class="py-16 text-center"><p class="text-gray-500">${ssrInterpolate(labels.value.emptyMessage)}</p></div>`);
      }
      _push(`</div><!--]-->`);
    };
  }
});
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/StudioDetailPage.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const __vite_glob_0_29 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main$4
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  ...{ layout: _sfc_main$T },
  __name: "StudioIndexPage",
  __ssrInlineRender: true,
  props: {
    studios: {},
    filters: {},
    kind: {}
  },
  setup(__props) {
    const props = __props;
    const labels = computed(() => props.kind === "producer" ? {
      heading: "Anime Producers",
      description: "Browse anime production companies and licensors.",
      countSuffix: "producers",
      searchPlaceholder: "Search producers...",
      empty: "No producers found.",
      indexRoute: "producers.index",
      showRoute: "producers.show"
    } : {
      heading: "Anime Studios",
      description: "Browse animation studios and explore their catalog.",
      countSuffix: "animation studios",
      searchPlaceholder: "Search studios...",
      empty: "No studios found.",
      indexRoute: "studios.index",
      showRoute: "studios.show"
    });
    const search = ref(props.filters.search);
    function studioUrl(studio) {
      return studio.slug ? route(labels.value.showRoute, { studio: studio.slug }) : "#";
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Head = resolveComponent("Head");
      const _component_Link = resolveComponent("Link");
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_Head, {
        title: labels.value.heading
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<meta name="description"${ssrRenderAttr("content", labels.value.description)}${_scopeId}><link rel="canonical"${ssrRenderAttr("href", _ctx.route(labels.value.indexRoute))}${_scopeId}>`);
          } else {
            return [
              createVNode("meta", {
                name: "description",
                content: labels.value.description
              }, null, 8, ["content"]),
              createVNode("link", {
                rel: "canonical",
                href: _ctx.route(labels.value.indexRoute)
              }, null, 8, ["href"])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div><div class="mb-6"><h1 class="text-2xl font-bold text-gray-100 md:text-3xl">${ssrInterpolate(labels.value.heading)}</h1><p class="mt-1 text-sm text-gray-400"> Browse ${ssrInterpolate(__props.studios.meta.total.toLocaleString())} ${ssrInterpolate(labels.value.countSuffix)}. </p></div><div class="mb-6"><form><input${ssrRenderAttr("value", search.value)} type="search"${ssrRenderAttr("placeholder", labels.value.searchPlaceholder)} class="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-gray-200 placeholder-gray-500 outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500"></form></div>`);
      if (__props.studios.data.length) {
        _push(`<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"><!--[-->`);
        ssrRenderList(__props.studios.data, (studio) => {
          _push(ssrRenderComponent(_component_Link, {
            key: studio.id,
            href: studioUrl(studio),
            class: "group flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3 transition hover:border-primary-600 hover:bg-gray-900"
          }, {
            default: withCtx((_2, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<span class="truncate font-medium text-gray-200 group-hover:text-primary-400"${_scopeId}>${ssrInterpolate(studio.name)}</span><span class="ml-3 shrink-0 rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400"${_scopeId}>${ssrInterpolate(studio.anime_count)}</span>`);
              } else {
                return [
                  createVNode("span", { class: "truncate font-medium text-gray-200 group-hover:text-primary-400" }, toDisplayString(studio.name), 1),
                  createVNode("span", { class: "ml-3 shrink-0 rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400" }, toDisplayString(studio.anime_count), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<div class="py-16 text-center"><p class="text-gray-500">${ssrInterpolate(labels.value.empty)}</p></div>`);
      }
      _push(`<div class="mt-8">`);
      _push(ssrRenderComponent(_sfc_main$Q, {
        "current-page": __props.studios.meta.current_page,
        "last-page": __props.studios.meta.last_page,
        total: __props.studios.meta.total
      }, null, _parent));
      _push(`</div></div><!--]-->`);
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/StudioIndexPage.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const __vite_glob_0_30 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main$3
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  ...{ layout: _sfc_main$T },
  __name: "TermsPage",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Head = resolveComponent("Head");
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_Head, { title: "Terms of Service" }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<meta name="description" content="AniTrack Terms of Service."${_scopeId}><link rel="canonical"${ssrRenderAttr("href", _ctx.route("terms"))}${_scopeId}>`);
          } else {
            return [
              createVNode("meta", {
                name: "description",
                content: "AniTrack Terms of Service."
              }),
              createVNode("link", {
                rel: "canonical",
                href: _ctx.route("terms")
              }, null, 8, ["href"])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div class="mx-auto max-w-3xl space-y-8 py-4"><h1 class="text-3xl font-bold">Terms of Service</h1><p class="text-sm text-gray-500">Last updated: March 8, 2026</p><section class="space-y-3"><h2 class="text-xl font-semibold text-gray-200">1. Acceptance of Terms</h2><p class="text-gray-400 leading-relaxed"> By accessing or using AniTrack, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service. </p></section><section class="space-y-3"><h2 class="text-xl font-semibold text-gray-200">2. Description of Service</h2><p class="text-gray-400 leading-relaxed"> AniTrack is a personal anime tracking platform that allows users to browse anime information, maintain a personal watchlist, track viewing progress, and share their anime list with others. </p></section><section class="space-y-3"><h2 class="text-xl font-semibold text-gray-200">3. User Accounts</h2><p class="text-gray-400 leading-relaxed"> You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate information when creating an account and keep it up to date. You may not create accounts for the purpose of abusing the service or other users. </p></section><section class="space-y-3"><h2 class="text-xl font-semibold text-gray-200">4. Acceptable Use</h2><p class="text-gray-400 leading-relaxed">You agree not to:</p><ul class="list-disc pl-6 space-y-1 text-gray-400"><li>Use the service for any unlawful purpose</li><li>Attempt to gain unauthorised access to any part of the service</li><li>Interfere with or disrupt the service or its infrastructure</li><li>Scrape, crawl, or otherwise extract data from the service in an automated manner beyond normal use</li><li>Impersonate any person or entity</li></ul></section><section class="space-y-3"><h2 class="text-xl font-semibold text-gray-200">5. Third-Party Content</h2><p class="text-gray-400 leading-relaxed"> Anime information, metadata, and images displayed on AniTrack are sourced from third-party providers, primarily AniList. AniTrack does not claim ownership of this content. The accuracy and availability of third-party content is not guaranteed. </p></section><section class="space-y-3"><h2 class="text-xl font-semibold text-gray-200">6. Limitation of Liability</h2><p class="text-gray-400 leading-relaxed"> AniTrack is provided &quot;as is&quot; without warranties of any kind, either express or implied. We do not guarantee that the service will be uninterrupted, secure, or error-free. In no event shall AniTrack be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of the service. </p></section><section class="space-y-3"><h2 class="text-xl font-semibold text-gray-200">7. Termination</h2><p class="text-gray-400 leading-relaxed"> We reserve the right to suspend or terminate your account at our discretion, without prior notice, for conduct that we determine violates these terms or is harmful to the service or other users. You may delete your account at any time through the settings page. </p></section><section class="space-y-3"><h2 class="text-xl font-semibold text-gray-200">8. Changes to Terms</h2><p class="text-gray-400 leading-relaxed"> We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the updated terms. We encourage you to review this page periodically. </p></section></div><!--]-->`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/TermsPage.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __vite_glob_0_31 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main$2
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  ...{ layout: _sfc_main$T },
  __name: "TopAnimePage",
  __ssrInlineRender: true,
  props: {
    anime: {},
    metric: {}
  },
  setup(__props) {
    function displayTitle(anime) {
      return anime.title_english || anime.title_romaji;
    }
    function formatLabel(format) {
      if (!format) return "";
      return format.replace(/_/g, " ");
    }
    function animeUrl(anime) {
      if (anime.slug) {
        return route("anime.show", { anime: anime.slug });
      }
      if (anime.anilist_id) {
        return route("anime.show.anilist", { anilistId: anime.anilist_id });
      }
      return "#";
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Head = resolveComponent("Head");
      const _component_Link = resolveComponent("Link");
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_Head, {
        title: __props.metric === "rated" ? "Top Rated Anime" : "Most Popular Anime"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<meta name="description"${ssrRenderAttr("content", __props.metric === "rated" ? "The highest rated anime of all time." : "The most popular anime of all time.")}${_scopeId}><link rel="canonical"${ssrRenderAttr("href", __props.metric === "rated" ? _ctx.route("top.rated") : _ctx.route("top.popular"))}${_scopeId}><meta property="og:title"${ssrRenderAttr("content", __props.metric === "rated" ? "Top 100 Rated Anime — AniTrack" : "Top 100 Most Popular Anime — AniTrack")}${_scopeId}><meta property="og:description"${ssrRenderAttr("content", __props.metric === "rated" ? "The highest rated anime of all time." : "The most popular anime of all time.")}${_scopeId}><meta property="og:type" content="website"${_scopeId}><meta name="twitter:card" content="summary"${_scopeId}>`);
          } else {
            return [
              createVNode("meta", {
                name: "description",
                content: __props.metric === "rated" ? "The highest rated anime of all time." : "The most popular anime of all time."
              }, null, 8, ["content"]),
              createVNode("link", {
                rel: "canonical",
                href: __props.metric === "rated" ? _ctx.route("top.rated") : _ctx.route("top.popular")
              }, null, 8, ["href"]),
              createVNode("meta", {
                property: "og:title",
                content: __props.metric === "rated" ? "Top 100 Rated Anime — AniTrack" : "Top 100 Most Popular Anime — AniTrack"
              }, null, 8, ["content"]),
              createVNode("meta", {
                property: "og:description",
                content: __props.metric === "rated" ? "The highest rated anime of all time." : "The most popular anime of all time."
              }, null, 8, ["content"]),
              createVNode("meta", {
                property: "og:type",
                content: "website"
              }),
              createVNode("meta", {
                name: "twitter:card",
                content: "summary"
              })
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div class="mx-auto max-w-5xl space-y-6"><h1 class="text-3xl font-bold text-gray-100 text-center">Top 100 Anime</h1><div class="flex justify-center gap-1 rounded-lg bg-gray-900 p-1">`);
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("top.rated"),
        class: ["rounded-md px-6 py-2 text-sm font-medium transition", __props.metric === "rated" ? "bg-gray-700 text-gray-100" : "text-gray-400 hover:text-gray-200"]
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Top Rated `);
          } else {
            return [
              createTextVNode(" Top Rated ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("top.popular"),
        class: ["rounded-md px-6 py-2 text-sm font-medium transition", __props.metric === "popular" ? "bg-gray-700 text-gray-100" : "text-gray-400 hover:text-gray-200"]
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Most Popular `);
          } else {
            return [
              createTextVNode(" Most Popular ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="space-y-2"><!--[-->`);
      ssrRenderList(__props.anime, (item, index) => {
        _push(ssrRenderComponent(_component_Link, {
          key: item.id ?? item.anilist_id,
          href: animeUrl(item),
          class: "flex items-center gap-4 rounded-lg border border-gray-800 bg-gray-900 p-3 transition hover:border-gray-700 hover:bg-gray-800/80"
        }, {
          default: withCtx((_2, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<div class="${ssrRenderClass([index < 3 ? "text-primary-400" : "text-gray-500", "w-10 shrink-0 text-center text-lg font-bold"])}"${_scopeId}>${ssrInterpolate(index + 1)}</div><div class="h-16 w-11 shrink-0 overflow-hidden rounded bg-gray-800"${_scopeId}>`);
              if (item.cover_image_medium || item.cover_image_large) {
                _push2(`<img${ssrRenderAttr("src", (item.cover_image_medium || item.cover_image_large) ?? void 0)}${ssrRenderAttr("alt", displayTitle(item))} class="h-full w-full object-cover" loading="lazy"${_scopeId}>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div><div class="min-w-0 flex-1"${_scopeId}><h3 class="truncate font-medium text-gray-200"${_scopeId}>${ssrInterpolate(displayTitle(item))}</h3><div class="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500"${_scopeId}>`);
              if (item.format) {
                _push2(`<span${_scopeId}>${ssrInterpolate(formatLabel(item.format))}</span>`);
              } else {
                _push2(`<!---->`);
              }
              if (item.episodes) {
                _push2(`<span${_scopeId}>${ssrInterpolate(item.episodes)} ep</span>`);
              } else {
                _push2(`<!---->`);
              }
              if (item.status) {
                _push2(`<span class="hidden sm:inline"${_scopeId}>${ssrInterpolate(item.status.replace(/_/g, " "))}</span>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div></div><div class="flex shrink-0 items-center gap-4"${_scopeId}>`);
              if (__props.metric === "rated") {
                _push2(`<div class="text-right"${_scopeId}>`);
                _push2(ssrRenderComponent(_sfc_main$H, {
                  score: item.bayesian_score ?? item.average_score,
                  size: "md"
                }, null, _parent2, _scopeId));
                _push2(`</div>`);
              } else {
                _push2(`<!---->`);
              }
              if (__props.metric === "popular") {
                _push2(`<div class="text-right"${_scopeId}><span class="text-sm font-semibold text-gray-300"${_scopeId}>${ssrInterpolate(item.popularity?.toLocaleString())}</span><div class="text-[10px] text-gray-500"${_scopeId}>popularity</div></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`<div class="hidden text-right sm:block"${_scopeId}>`);
              if (__props.metric === "rated") {
                _push2(`<span class="text-xs text-gray-500"${_scopeId}>${ssrInterpolate(item.popularity?.toLocaleString())} pop</span>`);
              } else {
                _push2(ssrRenderComponent(_sfc_main$H, {
                  score: item.bayesian_score ?? item.average_score,
                  size: "sm"
                }, null, _parent2, _scopeId));
              }
              _push2(`</div></div>`);
            } else {
              return [
                createVNode("div", {
                  class: ["w-10 shrink-0 text-center text-lg font-bold", index < 3 ? "text-primary-400" : "text-gray-500"]
                }, toDisplayString(index + 1), 3),
                createVNode("div", { class: "h-16 w-11 shrink-0 overflow-hidden rounded bg-gray-800" }, [
                  item.cover_image_medium || item.cover_image_large ? (openBlock(), createBlock("img", {
                    key: 0,
                    src: (item.cover_image_medium || item.cover_image_large) ?? void 0,
                    alt: displayTitle(item),
                    class: "h-full w-full object-cover",
                    loading: "lazy"
                  }, null, 8, ["src", "alt"])) : createCommentVNode("", true)
                ]),
                createVNode("div", { class: "min-w-0 flex-1" }, [
                  createVNode("h3", { class: "truncate font-medium text-gray-200" }, toDisplayString(displayTitle(item)), 1),
                  createVNode("div", { class: "mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500" }, [
                    item.format ? (openBlock(), createBlock("span", { key: 0 }, toDisplayString(formatLabel(item.format)), 1)) : createCommentVNode("", true),
                    item.episodes ? (openBlock(), createBlock("span", { key: 1 }, toDisplayString(item.episodes) + " ep", 1)) : createCommentVNode("", true),
                    item.status ? (openBlock(), createBlock("span", {
                      key: 2,
                      class: "hidden sm:inline"
                    }, toDisplayString(item.status.replace(/_/g, " ")), 1)) : createCommentVNode("", true)
                  ])
                ]),
                createVNode("div", { class: "flex shrink-0 items-center gap-4" }, [
                  __props.metric === "rated" ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "text-right"
                  }, [
                    createVNode(_sfc_main$H, {
                      score: item.bayesian_score ?? item.average_score,
                      size: "md"
                    }, null, 8, ["score"])
                  ])) : createCommentVNode("", true),
                  __props.metric === "popular" ? (openBlock(), createBlock("div", {
                    key: 1,
                    class: "text-right"
                  }, [
                    createVNode("span", { class: "text-sm font-semibold text-gray-300" }, toDisplayString(item.popularity?.toLocaleString()), 1),
                    createVNode("div", { class: "text-[10px] text-gray-500" }, "popularity")
                  ])) : createCommentVNode("", true),
                  createVNode("div", { class: "hidden text-right sm:block" }, [
                    __props.metric === "rated" ? (openBlock(), createBlock("span", {
                      key: 0,
                      class: "text-xs text-gray-500"
                    }, toDisplayString(item.popularity?.toLocaleString()) + " pop", 1)) : (openBlock(), createBlock(_sfc_main$H, {
                      key: 1,
                      score: item.bayesian_score ?? item.average_score,
                      size: "sm"
                    }, null, 8, ["score"]))
                  ])
                ])
              ];
            }
          }),
          _: 2
        }, _parent));
      });
      _push(`<!--]--></div></div><!--]-->`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/TopAnimePage.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __vite_glob_0_32 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main$1
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "WelcomePage",
  __ssrInlineRender: true,
  props: {
    featuredAnime: {},
    totalAnime: {}
  },
  setup(__props) {
    const props = __props;
    const { query, results, isLoading } = useAnimeSearch();
    const displayed = computed(() => {
      if (query.value.trim().length >= 2) {
        return results.value.slice(0, 12);
      }
      return props.featuredAnime;
    });
    const showingSearch = computed(() => query.value.trim().length >= 2);
    function displayTitle(anime) {
      return anime.title_english || anime.title_romaji;
    }
    function animeUrl(anime) {
      if (anime.slug) {
        return route("anime.show", { anime: anime.slug });
      }
      if (anime.anilist_id) {
        return route("anime.show.anilist", { anilistId: anime.anilist_id });
      }
      return "#";
    }
    function progressLabel(anime) {
      if (anime.episodes) {
        return `${anime.episodes} ep`;
      }
      if (anime.format) {
        return anime.format.replace(/_/g, " ");
      }
      return "";
    }
    const features = [
      {
        label: "01 / Track",
        title: "Never lose your place",
        body: "One tap to mark an episode watched. Your progress syncs instantly across every device you sign in on, so picking up where you left off is friction-free."
      },
      {
        label: "02 / Discover",
        title: "Find your next favourite",
        body: "Browse what is airing this season, what is trending right now, and what reviewers actually rate. Real-time countdowns tell you when the next episode drops."
      },
      {
        label: "03 / Share",
        title: "Compare lists with friends",
        body: "Public profiles, shareable watchlists, and side-by-side comparisons. Find out who in your circle has the best taste — and who needs an intervention."
      }
    ];
    const animeStat = computed(() => {
      if (props.totalAnime >= 1e3) {
        const thousands = Math.floor(props.totalAnime / 1e3);
        return `${thousands}K+`;
      }
      return `${props.totalAnime}+`;
    });
    const stats = computed(() => [
      { value: animeStat.value, label: "Anime in database" },
      { value: "100%", label: "Free, forever" },
      { value: "0", label: "Ads, ever" },
      { value: "<30s", label: "To get set up" }
    ]);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Head = resolveComponent("Head");
      const _component_Link = resolveComponent("Link");
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_Head, { title: "Track every anime you watch" }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<meta name="description" content="AniTrack is a free anime tracker. Build your watchlist, mark episodes watched, follow seasonal releases, and sync across devices. No ads, no paywall."${_scopeId}><meta name="robots" content="index,follow"${_scopeId}><link rel="canonical"${ssrRenderAttr("href", _ctx.route("welcome"))}${_scopeId}><meta property="og:title" content="AniTrack — Track every anime you watch"${_scopeId}><meta property="og:description" content="Free anime tracker. No ads, no paywall, ever. Built by anime fans, for anime fans."${_scopeId}><meta property="og:type" content="website"${_scopeId}><meta name="twitter:card" content="summary"${_scopeId}>`);
          } else {
            return [
              createVNode("meta", {
                name: "description",
                content: "AniTrack is a free anime tracker. Build your watchlist, mark episodes watched, follow seasonal releases, and sync across devices. No ads, no paywall."
              }),
              createVNode("meta", {
                name: "robots",
                content: "index,follow"
              }),
              createVNode("link", {
                rel: "canonical",
                href: _ctx.route("welcome")
              }, null, 8, ["href"]),
              createVNode("meta", {
                property: "og:title",
                content: "AniTrack — Track every anime you watch"
              }),
              createVNode("meta", {
                property: "og:description",
                content: "Free anime tracker. No ads, no paywall, ever. Built by anime fans, for anime fans."
              }),
              createVNode("meta", {
                property: "og:type",
                content: "website"
              }),
              createVNode("meta", {
                name: "twitter:card",
                content: "summary"
              })
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div class="min-h-screen bg-gray-950 text-gray-100 dark"><nav class="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm"><div class="container mx-auto flex h-14 items-center justify-between px-4">`);
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("welcome"),
        class: "flex items-center gap-2 text-lg font-bold"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<span class="inline-block h-5 w-5 rounded-md bg-gradient-to-br from-primary-400 to-primary-700"${_scopeId}></span><span class="text-primary-400"${_scopeId}>AniTrack</span>`);
          } else {
            return [
              createVNode("span", { class: "inline-block h-5 w-5 rounded-md bg-gradient-to-br from-primary-400 to-primary-700" }),
              createVNode("span", { class: "text-primary-400" }, "AniTrack")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("login"),
        class: "text-sm text-gray-400 transition hover:text-gray-100"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Sign in`);
          } else {
            return [
              createTextVNode("Sign in")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></nav><main><section class="relative overflow-hidden"><div class="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_-10%,rgba(99,102,241,0.18),transparent_70%)]"></div><div class="container relative mx-auto px-4 pt-16 pb-12 sm:pt-24 sm:pb-16"><div class="mx-auto max-w-3xl text-center"><span class="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-3 py-1 text-xs font-medium text-primary-300"><span class="h-1.5 w-1.5 rounded-full bg-primary-400"></span> Free anime tracker. No paywall, ever. </span><h1 class="mt-6 text-4xl font-bold leading-tight tracking-tight text-gray-50 sm:text-5xl md:text-6xl"> Track every anime you watch. <span class="block bg-gradient-to-r from-primary-300 via-primary-400 to-fuchsia-400 bg-clip-text text-transparent"> All in one place. </span></h1><p class="mx-auto mt-5 max-w-2xl text-base text-gray-400 sm:text-lg"> Build a watchlist, mark episodes watched, and keep up with seasonal releases. Get notified when new episodes drop and pick up where you left off on any device. </p><div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">`);
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("register"),
        class: "rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white shadow-lg shadow-primary-950/50 transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Sign up free `);
          } else {
            return [
              createTextVNode(" Sign up free ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("login"),
        class: "rounded-lg border border-gray-700 bg-gray-900/60 px-6 py-3 font-semibold text-gray-200 transition hover:border-gray-600 hover:bg-gray-800"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` I already have an account `);
          } else {
            return [
              createTextVNode(" I already have an account ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><ul class="mx-auto mt-5 flex max-w-lg flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-gray-400"><!--[-->`);
      ssrRenderList(["Free forever", "No credit card", "No ads, ever"], (claim) => {
        _push(`<li class="flex items-center gap-1.5"><svg class="h-3.5 w-3.5 text-primary-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg> ${ssrInterpolate(claim)}</li>`);
      });
      _push(`<!--]--></ul></div></div></section><section class="container mx-auto px-4 pb-16 sm:pb-24"><div class="mx-auto max-w-5xl"><div class="mb-5 text-center"><p class="text-xs font-semibold uppercase tracking-wider text-primary-400">Try it now</p><h2 class="mt-2 text-2xl font-bold text-gray-50 sm:text-3xl"> Search ${ssrInterpolate(animeStat.value)} anime in our database </h2><p class="mt-2 text-sm text-gray-400"> Find a show, then sign up to add it to your list. </p></div><div class="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/60"><div class="border-b border-gray-800 bg-gray-950/60 p-3 sm:p-4"><div class="relative"><svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"></path></svg><input${ssrRenderAttr("value", unref(query))} type="search" placeholder="Search Frieren, Solo Leveling, anything..." class="w-full rounded-lg border border-gray-700 bg-gray-900 py-3 pl-10 pr-4 text-sm text-gray-100 placeholder-gray-500 outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500"></div></div><div class="p-4 sm:p-6">`);
      if (showingSearch.value && unref(isLoading) && displayed.value.length === 0) {
        _push(`<div class="py-12 text-center text-sm text-gray-500"> Searching... </div>`);
      } else if (showingSearch.value && displayed.value.length === 0) {
        _push(`<div class="py-12 text-center text-sm text-gray-500"> No anime matched &quot;${ssrInterpolate(unref(query))}&quot;. Try another title. </div>`);
      } else {
        _push(`<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6"><!--[-->`);
        ssrRenderList(displayed.value, (anime) => {
          _push(ssrRenderComponent(_component_Link, {
            key: anime.id ?? anime.anilist_id,
            href: animeUrl(anime),
            class: "group block rounded-lg border border-gray-800 bg-gray-950/40 p-2 transition hover:border-primary-500/40 hover:bg-gray-900"
          }, {
            default: withCtx((_2, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<div class="relative aspect-[3/4] overflow-hidden rounded-md bg-gray-800"${_scopeId}>`);
                if (anime.cover_image_medium) {
                  _push2(`<img${ssrRenderAttr("src", anime.cover_image_medium)}${ssrRenderAttr("alt", displayTitle(anime))} loading="lazy" class="h-full w-full object-cover transition group-hover:scale-105"${_scopeId}>`);
                } else {
                  _push2(`<!---->`);
                }
                if (anime.average_score) {
                  _push2(`<span class="absolute right-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-primary-300 backdrop-blur"${_scopeId}>${ssrInterpolate(anime.average_score.toFixed(1))}</span>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div><p class="mt-2 line-clamp-1 px-1 text-xs font-medium text-gray-100"${_scopeId}>${ssrInterpolate(displayTitle(anime))}</p><p class="mt-0.5 line-clamp-1 px-1 text-[11px] text-gray-500"${_scopeId}>${ssrInterpolate(progressLabel(anime))}</p>`);
              } else {
                return [
                  createVNode("div", { class: "relative aspect-[3/4] overflow-hidden rounded-md bg-gray-800" }, [
                    anime.cover_image_medium ? (openBlock(), createBlock("img", {
                      key: 0,
                      src: anime.cover_image_medium,
                      alt: displayTitle(anime),
                      loading: "lazy",
                      class: "h-full w-full object-cover transition group-hover:scale-105"
                    }, null, 8, ["src", "alt"])) : createCommentVNode("", true),
                    anime.average_score ? (openBlock(), createBlock("span", {
                      key: 1,
                      class: "absolute right-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-primary-300 backdrop-blur"
                    }, toDisplayString(anime.average_score.toFixed(1)), 1)) : createCommentVNode("", true)
                  ]),
                  createVNode("p", { class: "mt-2 line-clamp-1 px-1 text-xs font-medium text-gray-100" }, toDisplayString(displayTitle(anime)), 1),
                  createVNode("p", { class: "mt-0.5 line-clamp-1 px-1 text-[11px] text-gray-500" }, toDisplayString(progressLabel(anime)), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div></div><p class="mt-4 text-center text-xs text-gray-500"> Found something to watch? `);
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("register"),
        class: "font-semibold text-primary-400 hover:text-primary-300"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Create a free account`);
          } else {
            return [
              createTextVNode("Create a free account")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(` to start tracking. </p></div></section><section class="container mx-auto px-4 pb-16 sm:pb-24"><div class="mx-auto max-w-5xl rounded-2xl border border-gray-800 bg-gray-950"><div class="grid grid-cols-1 divide-y divide-gray-800 md:grid-cols-3 md:divide-x md:divide-y-0"><!--[-->`);
      ssrRenderList(features, (feature) => {
        _push(`<div class="p-8 sm:p-10"><p class="text-xs font-semibold uppercase tracking-wider text-primary-400">${ssrInterpolate(feature.label)}</p><div class="mt-4 flex h-9 w-9 items-center justify-center rounded-lg border border-gray-800 bg-gray-900 text-primary-400">`);
        if (feature.label.startsWith("01")) {
          _push(`<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>`);
        } else if (feature.label.startsWith("02")) {
          _push(`<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"></path></svg>`);
        } else {
          _push(`<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.97 5.97 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path></svg>`);
        }
        _push(`</div><h3 class="mt-4 text-lg font-semibold text-gray-100">${ssrInterpolate(feature.title)}</h3><p class="mt-2 text-sm leading-relaxed text-gray-400">${ssrInterpolate(feature.body)}</p></div>`);
      });
      _push(`<!--]--></div></div></section><section class="container mx-auto px-4 pb-16 sm:pb-24"><div class="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900"><div class="grid grid-cols-1 items-center gap-8 p-8 sm:p-10 md:grid-cols-5"><div class="md:col-span-3"><p class="text-xs font-semibold uppercase tracking-wider text-primary-400">Switching from MyAnimeList?</p><h2 class="mt-3 text-2xl font-bold tracking-tight text-gray-50 sm:text-3xl"> Bring your watchlist with you in <span class="bg-gradient-to-r from-primary-300 to-fuchsia-400 bg-clip-text text-transparent">under a minute.</span></h2><p class="mt-3 text-sm leading-relaxed text-gray-400 sm:text-base"> Export your list from MAL, drop the XML file into our importer, and we will match every title, preserve your scores, status and episode progress, and keep your dates intact. Years of tracking, moved over in a couple of clicks. </p><ul class="mt-5 grid grid-cols-1 gap-2 text-sm text-gray-300 sm:grid-cols-2"><!--[-->`);
      ssrRenderList(["Scores and statuses preserved", "Episode progress carried over", "Start dates and finish dates kept", "Preview matches before committing"], (bullet) => {
        _push(`<li class="flex items-center gap-2"><svg class="h-4 w-4 flex-shrink-0 text-primary-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg> ${ssrInterpolate(bullet)}</li>`);
      });
      _push(`<!--]--></ul></div><div class="md:col-span-2"><div class="flex items-center justify-center gap-3 rounded-xl border border-gray-800 bg-gray-950/60 p-5"><div class="flex h-14 w-14 items-center justify-center rounded-lg border border-gray-800 bg-gray-900 text-xs font-bold tracking-wider text-gray-400"> MAL </div><svg class="h-5 w-5 flex-shrink-0 text-primary-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg><div class="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-xs font-bold tracking-wider text-white"> AT </div></div><p class="mt-3 text-center text-xs text-gray-500">`);
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("register"),
        class: "font-semibold text-primary-400 hover:text-primary-300"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Sign up`);
          } else {
            return [
              createTextVNode("Sign up")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(` then head to Import. Done in about a minute. </p></div></div></div></section><section class="container mx-auto px-4 pb-16 sm:pb-24"><div class="mx-auto max-w-3xl text-center"><p class="text-xs font-semibold uppercase tracking-wider text-primary-400">Why we are different</p><h2 class="mt-3 text-3xl font-bold tracking-tight text-gray-50 sm:text-4xl"> Free forever isn&#39;t a <span class="bg-gradient-to-r from-primary-300 to-fuchsia-400 bg-clip-text text-transparent">marketing line.</span></h2><p class="mt-5 text-base leading-relaxed text-gray-400 sm:text-lg"> AniTrack has no ads, no premium tier, and no plan to add either. It is built by anime fans for anime fans, and run on a few friends&#39; spare evenings. The whole project exists because the older trackers feel ancient and the newer ones want a subscription. We just wanted a fast, modern place to keep our lists. So we made one, and we are sharing it. </p></div></section><section class="border-y border-gray-800 bg-gray-950"><div class="container mx-auto px-4 py-10"><div class="grid grid-cols-2 gap-6 text-center sm:grid-cols-4"><!--[-->`);
      ssrRenderList(stats.value, (stat) => {
        _push(`<div><p class="text-3xl font-bold text-gray-50 sm:text-4xl">${ssrInterpolate(stat.value)}</p><p class="mt-1 text-xs uppercase tracking-wider text-gray-500">${ssrInterpolate(stat.label)}</p></div>`);
      });
      _push(`<!--]--></div></div></section><section class="container mx-auto px-4 py-20 sm:py-28"><div class="mx-auto max-w-2xl text-center"><h2 class="text-3xl font-bold tracking-tight text-gray-50 sm:text-5xl"> Start tracking. <span class="bg-gradient-to-r from-primary-300 to-fuchsia-400 bg-clip-text text-transparent">It&#39;s free.</span></h2><div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">`);
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("register"),
        class: "rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white shadow-lg shadow-primary-950/50 transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Create your account `);
          } else {
            return [
              createTextVNode(" Create your account ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><p class="mt-4 text-sm text-gray-500"> Under thirty seconds. No card, no trial, no catch. </p></div></section></main><footer class="border-t border-gray-800 bg-gray-950"><div class="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-6 font-mono text-xs text-gray-600 sm:flex-row"><p>© ${ssrInterpolate((/* @__PURE__ */ new Date()).getFullYear())} AniTrack</p><ul class="flex items-center gap-5"><li>`);
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("privacy"),
        class: "transition hover:text-gray-300"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Privacy`);
          } else {
            return [
              createTextVNode("Privacy")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li>`);
      _push(ssrRenderComponent(_component_Link, {
        href: _ctx.route("terms"),
        class: "transition hover:text-gray-300"
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Terms`);
          } else {
            return [
              createTextVNode("Terms")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</li><li><a href="mailto:hello@anitrack.app" class="transition hover:text-gray-300">Contact</a></li></ul></div></footer></div><!--]-->`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("resources/js/Pages/WelcomePage.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __vite_glob_0_33 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _sfc_main
}, Symbol.toStringTag, { value: "Module" }));
function t() {
  return t = Object.assign ? Object.assign.bind() : function(t3) {
    for (var e2 = 1; e2 < arguments.length; e2++) {
      var o2 = arguments[e2];
      for (var n2 in o2) ({}).hasOwnProperty.call(o2, n2) && (t3[n2] = o2[n2]);
    }
    return t3;
  }, t.apply(null, arguments);
}
const e = String.prototype.replace, o = /%20/g, n = { RFC1738: function(t3) {
  return e.call(t3, o, "+");
}, RFC3986: function(t3) {
  return String(t3);
} };
var r = "RFC3986";
const i = Object.prototype.hasOwnProperty, s = Array.isArray, u = /* @__PURE__ */ new WeakMap();
var l = function(t3, e2) {
  return u.set(t3, e2), t3;
};
function c(t3) {
  return u.has(t3);
}
var a = function(t3) {
  return u.get(t3);
}, f = function(t3, e2) {
  u.set(t3, e2);
};
const p = (function() {
  const t3 = [];
  for (let e2 = 0; e2 < 256; ++e2) t3.push("%" + ((e2 < 16 ? "0" : "") + e2.toString(16)).toUpperCase());
  return t3;
})(), y = function(t3, e2) {
  const o2 = e2 && e2.plainObjects ? /* @__PURE__ */ Object.create(null) : {};
  for (let e3 = 0; e3 < t3.length; ++e3) void 0 !== t3[e3] && (o2[e3] = t3[e3]);
  return o2;
}, d = function t2(e2, o2, n2) {
  if (!o2) return e2;
  if ("object" != typeof o2) {
    if (s(e2)) e2.push(o2);
    else {
      if (!e2 || "object" != typeof e2) return [e2, o2];
      if (c(e2)) {
        var r2 = a(e2) + 1;
        e2[r2] = o2, f(e2, r2);
      } else (n2 && (n2.plainObjects || n2.allowPrototypes) || !i.call(Object.prototype, o2)) && (e2[o2] = true);
    }
    return e2;
  }
  if (!e2 || "object" != typeof e2) {
    if (c(o2)) {
      for (var u2 = Object.keys(o2), p2 = n2 && n2.plainObjects ? { __proto__: null, 0: e2 } : { 0: e2 }, d2 = 0; d2 < u2.length; d2++) p2[parseInt(u2[d2], 10) + 1] = o2[u2[d2]];
      return l(p2, a(o2) + 1);
    }
    return [e2].concat(o2);
  }
  let h2 = e2;
  return s(e2) && !s(o2) && (h2 = y(e2, n2)), s(e2) && s(o2) ? (o2.forEach(function(o3, r3) {
    if (i.call(e2, r3)) {
      const i2 = e2[r3];
      i2 && "object" == typeof i2 && o3 && "object" == typeof o3 ? e2[r3] = t2(i2, o3, n2) : e2.push(o3);
    } else e2[r3] = o3;
  }), e2) : Object.keys(o2).reduce(function(e3, r3) {
    const s2 = o2[r3];
    return e3[r3] = i.call(e3, r3) ? t2(e3[r3], s2, n2) : s2, e3;
  }, h2);
}, h = 1024, b = function(t3, e2, o2, n2) {
  if (c(t3)) {
    var r2 = a(t3) + 1;
    return t3[r2] = e2, f(t3, r2), t3;
  }
  var i2 = [].concat(t3, e2);
  return i2.length > o2 ? l(y(i2, { plainObjects: n2 }), i2.length - 1) : i2;
}, m = function(t3, e2) {
  if (s(t3)) {
    const o2 = [];
    for (let n2 = 0; n2 < t3.length; n2 += 1) o2.push(e2(t3[n2]));
    return o2;
  }
  return e2(t3);
}, g = Object.prototype.hasOwnProperty, w = { brackets: function(t3) {
  return t3 + "[]";
}, comma: "comma", indices: function(t3, e2) {
  return t3 + "[" + e2 + "]";
}, repeat: function(t3) {
  return t3;
} }, v = Array.isArray, j = Array.prototype.push, $ = function(t3, e2) {
  j.apply(t3, v(e2) ? e2 : [e2]);
}, E = Date.prototype.toISOString, O = { addQueryPrefix: false, allowDots: false, allowEmptyArrays: false, arrayFormat: "indices", charset: "utf-8", charsetSentinel: false, delimiter: "&", encode: true, encodeDotInKeys: false, encoder: function(t3, e2, o2, n2, r2) {
  if (0 === t3.length) return t3;
  let i2 = t3;
  if ("symbol" == typeof t3 ? i2 = Symbol.prototype.toString.call(t3) : "string" != typeof t3 && (i2 = String(t3)), "iso-8859-1" === o2) return escape(i2).replace(/%u[0-9a-f]{4}/gi, function(t4) {
    return "%26%23" + parseInt(t4.slice(2), 16) + "%3B";
  });
  let s2 = "";
  for (let t4 = 0; t4 < i2.length; t4 += h) {
    const e3 = i2.length >= h ? i2.slice(t4, t4 + h) : i2, o3 = [];
    for (let t5 = 0; t5 < e3.length; ++t5) {
      let n3 = e3.charCodeAt(t5);
      45 === n3 || 46 === n3 || 95 === n3 || 126 === n3 || n3 >= 48 && n3 <= 57 || n3 >= 65 && n3 <= 90 || n3 >= 97 && n3 <= 122 || "RFC1738" === r2 && (40 === n3 || 41 === n3) ? o3[o3.length] = e3.charAt(t5) : n3 < 128 ? o3[o3.length] = p[n3] : n3 < 2048 ? o3[o3.length] = p[192 | n3 >> 6] + p[128 | 63 & n3] : n3 < 55296 || n3 >= 57344 ? o3[o3.length] = p[224 | n3 >> 12] + p[128 | n3 >> 6 & 63] + p[128 | 63 & n3] : (t5 += 1, n3 = 65536 + ((1023 & n3) << 10 | 1023 & e3.charCodeAt(t5)), o3[o3.length] = p[240 | n3 >> 18] + p[128 | n3 >> 12 & 63] + p[128 | n3 >> 6 & 63] + p[128 | 63 & n3]);
    }
    s2 += o3.join("");
  }
  return s2;
}, encodeValuesOnly: false, format: r, formatter: n[r], indices: false, serializeDate: function(t3) {
  return E.call(t3);
}, skipNulls: false, strictNullHandling: false }, T = {}, R = function(t3, e2, o2, n2, r2, i2, s2, u2, l2, c2, a2, f2, p2, y2, d2, h2, b2, g2) {
  let w2 = t3, j2 = g2, E2 = 0, _2 = false;
  for (; void 0 !== (j2 = j2.get(T)) && !_2; ) {
    const e3 = j2.get(t3);
    if (E2 += 1, void 0 !== e3) {
      if (e3 === E2) throw new RangeError("Cyclic object value");
      _2 = true;
    }
    void 0 === j2.get(T) && (E2 = 0);
  }
  if ("function" == typeof c2 ? w2 = c2(e2, w2) : w2 instanceof Date ? w2 = p2(w2) : "comma" === o2 && v(w2) && (w2 = m(w2, function(t4) {
    return t4 instanceof Date ? p2(t4) : t4;
  })), null === w2) {
    if (i2) return l2 && !h2 ? l2(e2, O.encoder, b2, "key", y2) : e2;
    w2 = "";
  }
  if ("string" == typeof (I2 = w2) || "number" == typeof I2 || "boolean" == typeof I2 || "symbol" == typeof I2 || "bigint" == typeof I2 || (function(t4) {
    return !(!t4 || "object" != typeof t4 || !(t4.constructor && t4.constructor.isBuffer && t4.constructor.isBuffer(t4)));
  })(w2)) return l2 ? [d2(h2 ? e2 : l2(e2, O.encoder, b2, "key", y2)) + "=" + d2(l2(w2, O.encoder, b2, "value", y2))] : [d2(e2) + "=" + d2(String(w2))];
  var I2;
  const S2 = [];
  if (void 0 === w2) return S2;
  let A2;
  if ("comma" === o2 && v(w2)) h2 && l2 && (w2 = m(w2, l2)), A2 = [{ value: w2.length > 0 ? w2.join(",") || null : void 0 }];
  else if (v(c2)) A2 = c2;
  else {
    const t4 = Object.keys(w2);
    A2 = a2 ? t4.sort(a2) : t4;
  }
  const D2 = u2 ? e2.replace(/\./g, "%2E") : e2, k2 = n2 && v(w2) && 1 === w2.length ? D2 + "[]" : D2;
  if (r2 && v(w2) && 0 === w2.length) return k2 + "[]";
  for (let e3 = 0; e3 < A2.length; ++e3) {
    const m2 = A2[e3], j3 = "object" == typeof m2 && void 0 !== m2.value ? m2.value : w2[m2];
    if (s2 && null === j3) continue;
    const O2 = f2 && u2 ? m2.replace(/\./g, "%2E") : m2, _3 = v(w2) ? "function" == typeof o2 ? o2(k2, O2) : k2 : k2 + (f2 ? "." + O2 : "[" + O2 + "]");
    g2.set(t3, E2);
    const I3 = /* @__PURE__ */ new WeakMap();
    I3.set(T, g2), $(S2, R(j3, _3, o2, n2, r2, i2, s2, u2, "comma" === o2 && h2 && v(w2) ? null : l2, c2, a2, f2, p2, y2, d2, h2, b2, I3));
  }
  return S2;
}, _ = Object.prototype.hasOwnProperty, I = Array.isArray, S = { allowDots: false, allowEmptyArrays: false, allowPrototypes: false, allowSparse: false, arrayLimit: 20, charset: "utf-8", charsetSentinel: false, comma: false, decodeDotInKeys: false, decoder: function(t3, e2, o2) {
  const n2 = t3.replace(/\+/g, " ");
  if ("iso-8859-1" === o2) return n2.replace(/%[0-9a-f]{2}/gi, unescape);
  try {
    return decodeURIComponent(n2);
  } catch (t4) {
    return n2;
  }
}, delimiter: "&", depth: 5, duplicates: "combine", ignoreQueryPrefix: false, interpretNumericEntities: false, parameterLimit: 1e3, parseArrays: true, plainObjects: false, strictNullHandling: false }, A = function(t3) {
  return t3.replace(/&#(\d+);/g, function(t4, e2) {
    return String.fromCharCode(parseInt(e2, 10));
  });
}, D = function(t3, e2) {
  return t3 && "string" == typeof t3 && e2.comma && t3.indexOf(",") > -1 ? t3.split(",") : t3;
}, k = function(t3, e2, o2, n2) {
  if (!t3) return;
  const r2 = o2.allowDots ? t3.replace(/\.([^.[]+)/g, "[$1]") : t3, i2 = /(\[[^[\]]*])/g;
  let s2 = o2.depth > 0 && /(\[[^[\]]*])/.exec(r2);
  const u2 = s2 ? r2.slice(0, s2.index) : r2, l2 = [];
  if (u2) {
    if (!o2.plainObjects && _.call(Object.prototype, u2) && !o2.allowPrototypes) return;
    l2.push(u2);
  }
  let a2 = 0;
  for (; o2.depth > 0 && null !== (s2 = i2.exec(r2)) && a2 < o2.depth; ) {
    if (a2 += 1, !o2.plainObjects && _.call(Object.prototype, s2[1].slice(1, -1)) && !o2.allowPrototypes) return;
    l2.push(s2[1]);
  }
  return s2 && l2.push("[" + r2.slice(s2.index) + "]"), (function(t4, e3, o3, n3) {
    let r3 = n3 ? e3 : D(e3, o3);
    for (let e4 = t4.length - 1; e4 >= 0; --e4) {
      let n4;
      const i3 = t4[e4];
      if ("[]" === i3 && o3.parseArrays) n4 = c(r3) ? r3 : o3.allowEmptyArrays && ("" === r3 || o3.strictNullHandling && null === r3) ? [] : b([], r3, o3.arrayLimit, o3.plainObjects);
      else {
        n4 = o3.plainObjects ? /* @__PURE__ */ Object.create(null) : {};
        const t5 = "[" === i3.charAt(0) && "]" === i3.charAt(i3.length - 1) ? i3.slice(1, -1) : i3, e5 = o3.decodeDotInKeys ? t5.replace(/%2E/g, ".") : t5, s3 = parseInt(e5, 10);
        o3.parseArrays || "" !== e5 ? !isNaN(s3) && i3 !== e5 && String(s3) === e5 && s3 >= 0 && o3.parseArrays && s3 <= o3.arrayLimit ? (n4 = [], n4[s3] = r3) : "__proto__" !== e5 && (n4[e5] = r3) : n4 = { 0: r3 };
      }
      r3 = n4;
    }
    return r3;
  })(l2, e2, o2, n2);
};
function N(t3, e2) {
  const o2 = /* @__PURE__ */ (function(t4) {
    return S;
  })();
  if ("" === t3 || null == t3) return o2.plainObjects ? /* @__PURE__ */ Object.create(null) : {};
  const n2 = "string" == typeof t3 ? (function(t4, e3) {
    const o3 = { __proto__: null }, n3 = (e3.ignoreQueryPrefix ? t4.replace(/^\?/, "") : t4).split(e3.delimiter, Infinity === e3.parameterLimit ? void 0 : e3.parameterLimit);
    let r3, i3 = -1, s2 = e3.charset;
    if (e3.charsetSentinel) for (r3 = 0; r3 < n3.length; ++r3) 0 === n3[r3].indexOf("utf8=") && ("utf8=%E2%9C%93" === n3[r3] ? s2 = "utf-8" : "utf8=%26%2310003%3B" === n3[r3] && (s2 = "iso-8859-1"), i3 = r3, r3 = n3.length);
    for (r3 = 0; r3 < n3.length; ++r3) {
      if (r3 === i3) continue;
      const t5 = n3[r3], u2 = t5.indexOf("]="), l2 = -1 === u2 ? t5.indexOf("=") : u2 + 1;
      let c2, a2;
      -1 === l2 ? (c2 = e3.decoder(t5, S.decoder, s2, "key"), a2 = e3.strictNullHandling ? null : "") : (c2 = e3.decoder(t5.slice(0, l2), S.decoder, s2, "key"), a2 = m(D(t5.slice(l2 + 1), e3), function(t6) {
        return e3.decoder(t6, S.decoder, s2, "value");
      })), a2 && e3.interpretNumericEntities && "iso-8859-1" === s2 && (a2 = A(a2)), t5.indexOf("[]=") > -1 && (a2 = I(a2) ? [a2] : a2);
      const f2 = _.call(o3, c2);
      f2 && "combine" === e3.duplicates ? o3[c2] = b(o3[c2], a2, e3.arrayLimit, e3.plainObjects) : f2 && "last" !== e3.duplicates || (o3[c2] = a2);
    }
    return o3;
  })(t3, o2) : t3;
  let r2 = o2.plainObjects ? /* @__PURE__ */ Object.create(null) : {};
  const i2 = Object.keys(n2);
  for (let e3 = 0; e3 < i2.length; ++e3) {
    const s2 = i2[e3], u2 = k(s2, n2[s2], o2, "string" == typeof t3);
    r2 = d(r2, u2, o2);
  }
  return true === o2.allowSparse ? r2 : (function(t4) {
    const e3 = [{ obj: { o: t4 }, prop: "o" }], o3 = [];
    for (let t5 = 0; t5 < e3.length; ++t5) {
      const n3 = e3[t5], r3 = n3.obj[n3.prop], i3 = Object.keys(r3);
      for (let t6 = 0; t6 < i3.length; ++t6) {
        const n4 = i3[t6], s2 = r3[n4];
        "object" == typeof s2 && null !== s2 && -1 === o3.indexOf(s2) && (e3.push({ obj: r3, prop: n4 }), o3.push(s2));
      }
    }
    return (function(t5) {
      for (; t5.length > 1; ) {
        const e4 = t5.pop(), o4 = e4.obj[e4.prop];
        if (s(o4)) {
          const t6 = [];
          for (let e5 = 0; e5 < o4.length; ++e5) void 0 !== o4[e5] && t6.push(o4[e5]);
          e4.obj[e4.prop] = t6;
        }
      }
    })(e3), t4;
  })(r2);
}
class x {
  constructor(t3, e2, o2) {
    var n2, r2;
    this.name = t3, this.definition = e2, this.bindings = null != (n2 = e2.bindings) ? n2 : {}, this.wheres = null != (r2 = e2.wheres) ? r2 : {}, this.config = o2;
  }
  get template() {
    const t3 = `${this.origin}/${this.definition.uri}`.replace(/\/+$/, "");
    return "" === t3 ? "/" : t3;
  }
  get origin() {
    return this.config.absolute ? this.definition.domain ? `${this.config.url.match(/^\w+:\/\//)[0]}${this.definition.domain}${this.config.port ? `:${this.config.port}` : ""}` : this.config.url : "";
  }
  get parameterSegments() {
    var t3, e2;
    return null != (t3 = null == (e2 = this.template.match(/{[^}?]+\??}/g)) ? void 0 : e2.map((t4) => ({ name: t4.replace(/{|\??}/g, ""), required: !/\?}$/.test(t4) }))) ? t3 : [];
  }
  matchesUrl(t3) {
    var e2;
    if (!this.definition.methods.includes("GET")) return false;
    const o2 = this.template.replace(/[.*+$()[\]]/g, "\\$&").replace(/(\/?){([^}?]*)(\??)}/g, (t4, e3, o3, n3) => {
      var r3;
      const i3 = `(?<${o3}>${(null == (r3 = this.wheres[o3]) ? void 0 : r3.replace(/(^\^)|(\$$)/g, "")) || "[^/?]+"})`;
      return n3 ? `(${e3}${i3})?` : `${e3}${i3}`;
    }).replace(/^\w+:\/\//, ""), [n2, r2] = t3.replace(/^\w+:\/\//, "").split("?"), i2 = null != (e2 = new RegExp(`^${o2}/?$`).exec(n2)) ? e2 : new RegExp(`^${o2}/?$`).exec(decodeURI(n2));
    if (i2) {
      for (const t4 in i2.groups) i2.groups[t4] = "string" == typeof i2.groups[t4] ? decodeURIComponent(i2.groups[t4]) : i2.groups[t4];
      return { params: i2.groups, query: N(r2) };
    }
    return false;
  }
  compile(t3) {
    return this.parameterSegments.length ? this.template.replace(/{([^}?]+)(\??)}/g, (e2, o2, n2) => {
      var r2, i2;
      if (!n2 && [null, void 0].includes(t3[o2])) throw new Error(`Ziggy error: '${o2}' parameter is required for route '${this.name}'.`);
      if (this.wheres[o2] && !new RegExp(`^${n2 ? `(${this.wheres[o2]})?` : this.wheres[o2]}$`).test(null != (i2 = t3[o2]) ? i2 : "")) throw new Error(`Ziggy error: '${o2}' parameter '${t3[o2]}' does not match required format '${this.wheres[o2]}' for route '${this.name}'.`);
      return encodeURI(null != (r2 = t3[o2]) ? r2 : "").replace(/%7C/g, "|").replace(/%25/g, "%").replace(/\$/g, "%24");
    }).replace(this.config.absolute ? /(\.[^/]+?)(\/\/)/ : /(^)(\/\/)/, "$1/").replace(/\/+$/, "") : this.template;
  }
}
class C extends String {
  constructor(e2, o2, n2 = true, r2) {
    if (super(), this.t = null != r2 ? r2 : "undefined" != typeof Ziggy ? Ziggy : null == globalThis ? void 0 : globalThis.Ziggy, !this.t && "undefined" != typeof document && document.getElementById("ziggy-routes-json") && (globalThis.Ziggy = JSON.parse(document.getElementById("ziggy-routes-json").textContent), this.t = globalThis.Ziggy), this.t = t({}, this.t, { absolute: n2 }), e2) {
      if (!this.t.routes[e2]) throw new Error(`Ziggy error: route '${e2}' is not in the route list.`);
      this.i = new x(e2, this.t.routes[e2], this.t), this.u = this.l(o2);
    }
  }
  toString() {
    const e2 = Object.keys(this.u).filter((t3) => !this.i.parameterSegments.some(({ name: e3 }) => e3 === t3)).filter((t3) => "_query" !== t3).reduce((e3, o2) => t({}, e3, { [o2]: this.u[o2] }), {});
    return this.i.compile(this.u) + (function(t3, e3) {
      let o2 = t3;
      const i2 = (function(t4) {
        if (!t4) return O;
        if (void 0 !== t4.allowEmptyArrays && "boolean" != typeof t4.allowEmptyArrays) throw new TypeError("`allowEmptyArrays` option can only be `true` or `false`, when provided");
        if (void 0 !== t4.encodeDotInKeys && "boolean" != typeof t4.encodeDotInKeys) throw new TypeError("`encodeDotInKeys` option can only be `true` or `false`, when provided");
        if (null != t4.encoder && "function" != typeof t4.encoder) throw new TypeError("Encoder has to be a function.");
        const e4 = t4.charset || O.charset;
        if (void 0 !== t4.charset && "utf-8" !== t4.charset && "iso-8859-1" !== t4.charset) throw new TypeError("The charset option must be either utf-8, iso-8859-1, or undefined");
        let o3 = r;
        if (void 0 !== t4.format) {
          if (!g.call(n, t4.format)) throw new TypeError("Unknown format option provided.");
          o3 = t4.format;
        }
        const i3 = n[o3];
        let s3, u3 = O.filter;
        if (("function" == typeof t4.filter || v(t4.filter)) && (u3 = t4.filter), s3 = t4.arrayFormat in w ? t4.arrayFormat : "indices" in t4 ? t4.indices ? "indices" : "repeat" : O.arrayFormat, "commaRoundTrip" in t4 && "boolean" != typeof t4.commaRoundTrip) throw new TypeError("`commaRoundTrip` must be a boolean, or absent");
        return { addQueryPrefix: "boolean" == typeof t4.addQueryPrefix ? t4.addQueryPrefix : O.addQueryPrefix, allowDots: void 0 === t4.allowDots ? true === t4.encodeDotInKeys || O.allowDots : !!t4.allowDots, allowEmptyArrays: "boolean" == typeof t4.allowEmptyArrays ? !!t4.allowEmptyArrays : O.allowEmptyArrays, arrayFormat: s3, charset: e4, charsetSentinel: "boolean" == typeof t4.charsetSentinel ? t4.charsetSentinel : O.charsetSentinel, commaRoundTrip: t4.commaRoundTrip, delimiter: void 0 === t4.delimiter ? O.delimiter : t4.delimiter, encode: "boolean" == typeof t4.encode ? t4.encode : O.encode, encodeDotInKeys: "boolean" == typeof t4.encodeDotInKeys ? t4.encodeDotInKeys : O.encodeDotInKeys, encoder: "function" == typeof t4.encoder ? t4.encoder : O.encoder, encodeValuesOnly: "boolean" == typeof t4.encodeValuesOnly ? t4.encodeValuesOnly : O.encodeValuesOnly, filter: u3, format: o3, formatter: i3, serializeDate: "function" == typeof t4.serializeDate ? t4.serializeDate : O.serializeDate, skipNulls: "boolean" == typeof t4.skipNulls ? t4.skipNulls : O.skipNulls, sort: "function" == typeof t4.sort ? t4.sort : null, strictNullHandling: "boolean" == typeof t4.strictNullHandling ? t4.strictNullHandling : O.strictNullHandling };
      })(e3);
      let s2, u2;
      "function" == typeof i2.filter ? (u2 = i2.filter, o2 = u2("", o2)) : v(i2.filter) && (u2 = i2.filter, s2 = u2);
      const l2 = [];
      if ("object" != typeof o2 || null === o2) return "";
      const c2 = w[i2.arrayFormat], a2 = "comma" === c2 && i2.commaRoundTrip;
      s2 || (s2 = Object.keys(o2)), i2.sort && s2.sort(i2.sort);
      const f2 = /* @__PURE__ */ new WeakMap();
      for (let t4 = 0; t4 < s2.length; ++t4) {
        const e4 = s2[t4];
        i2.skipNulls && null === o2[e4] || $(l2, R(o2[e4], e4, c2, a2, i2.allowEmptyArrays, i2.strictNullHandling, i2.skipNulls, i2.encodeDotInKeys, i2.encode ? i2.encoder : null, i2.filter, i2.sort, i2.allowDots, i2.serializeDate, i2.format, i2.formatter, i2.encodeValuesOnly, i2.charset, f2));
      }
      const p2 = l2.join(i2.delimiter);
      let y2 = true === i2.addQueryPrefix ? "?" : "";
      return i2.charsetSentinel && (y2 += "iso-8859-1" === i2.charset ? "utf8=%26%2310003%3B&" : "utf8=%E2%9C%93&"), p2.length > 0 ? y2 + p2 : "";
    })(t({}, e2, this.u._query), { addQueryPrefix: true, arrayFormat: "indices", encodeValuesOnly: true, skipNulls: true, encoder: (t3, e3) => "boolean" == typeof t3 ? Number(t3) : e3(t3) });
  }
  p(e2) {
    e2 ? this.t.absolute && e2.startsWith("/") && (e2 = this.h().host + e2) : e2 = this.m();
    let o2 = {};
    const [n2, r2] = Object.entries(this.t.routes).find(([t3, n3]) => o2 = new x(t3, n3, this.t).matchesUrl(e2)) || [void 0, void 0];
    return t({ name: n2 }, o2, { route: r2 });
  }
  m() {
    const { host: t3, pathname: e2, search: o2 } = this.h();
    return (this.t.absolute ? t3 + e2 : e2.replace(this.t.url.replace(/^\w*:\/\/[^/]+/, ""), "").replace(/^\/+/, "/")) + o2;
  }
  current(e2, o2) {
    const { name: n2, params: r2, query: i2, route: s2 } = this.p();
    if (!e2) return n2;
    const u2 = new RegExp(`^${e2.replace(/\./g, "\\.").replace(/\*/g, ".*")}$`).test(n2);
    if ([null, void 0].includes(o2) || !u2) return u2;
    const l2 = new x(n2, s2, this.t);
    o2 = this.l(o2, l2);
    const c2 = t({}, r2, i2);
    if (Object.values(o2).every((t3) => !t3) && !Object.values(c2).some((t3) => void 0 !== t3)) return true;
    const a2 = (t3, e3) => Object.entries(t3).every(([t4, o3]) => Array.isArray(o3) && Array.isArray(e3[t4]) ? o3.every((o4) => e3[t4].includes(o4) || e3[t4].includes(decodeURIComponent(o4))) : "object" == typeof o3 && "object" == typeof e3[t4] && null !== o3 && null !== e3[t4] ? a2(o3, e3[t4]) : e3[t4] == o3 || e3[t4] == decodeURIComponent(o3));
    return a2(o2, c2);
  }
  h() {
    var t3, e2, o2, n2, r2, i2;
    const { host: s2 = "", pathname: u2 = "", search: l2 = "" } = "undefined" != typeof window ? window.location : {};
    return { host: null != (t3 = null == (e2 = this.t.location) ? void 0 : e2.host) ? t3 : s2, pathname: null != (o2 = null == (n2 = this.t.location) ? void 0 : n2.pathname) ? o2 : u2, search: null != (r2 = null == (i2 = this.t.location) ? void 0 : i2.search) ? r2 : l2 };
  }
  get params() {
    const { params: e2, query: o2 } = this.p();
    return t({}, e2, o2);
  }
  get routeParams() {
    return this.p().params;
  }
  get queryParams() {
    return this.p().query;
  }
  has(t3) {
    return this.t.routes.hasOwnProperty(t3);
  }
  l(e2 = {}, o2 = this.i) {
    null != e2 || (e2 = {}), e2 = ["string", "number"].includes(typeof e2) ? [e2] : e2;
    const n2 = o2.parameterSegments.filter(({ name: t3 }) => !this.t.defaults[t3]);
    return Array.isArray(e2) ? e2 = e2.reduce((e3, o3, r2) => t({}, e3, n2[r2] ? { [n2[r2].name]: o3 } : "object" == typeof o3 ? o3 : { [o3]: "" }), {}) : 1 !== n2.length || e2[n2[0].name] || !e2.hasOwnProperty(Object.values(o2.bindings)[0]) && !e2.hasOwnProperty("id") || (e2 = { [n2[0].name]: e2 }), t({}, this.v(o2), this.j(e2, o2));
  }
  v(e2) {
    return e2.parameterSegments.filter(({ name: t3 }) => this.t.defaults[t3]).reduce((e3, { name: o2 }, n2) => t({}, e3, { [o2]: this.t.defaults[o2] }), {});
  }
  j(e2, { bindings: o2, parameterSegments: n2 }) {
    return Object.entries(e2).reduce((e3, [r2, i2]) => {
      if (!i2 || "object" != typeof i2 || Array.isArray(i2) || !n2.some(({ name: t3 }) => t3 === r2)) return t({}, e3, { [r2]: i2 });
      if (!i2.hasOwnProperty(o2[r2])) {
        if (!i2.hasOwnProperty("id")) throw new Error(`Ziggy error: object passed as '${r2}' parameter is missing route model binding key '${o2[r2]}'.`);
        o2[r2] = "id";
      }
      return t({}, e3, { [r2]: i2[o2[r2]] });
    }, {});
  }
  valueOf() {
    return this.toString();
  }
}
function P(t3, e2, o2, n2) {
  const r2 = new C(t3, e2, o2, n2);
  return t3 ? r2.toString() : r2;
}
const U = { install(t3, e2) {
  const o2 = (t4, o3, n2, r2 = e2) => P(t4, o3, n2, r2);
  parseInt(t3.version) > 2 ? (t3.config.globalProperties.route = o2, t3.provide("route", o2)) : t3.mixin({ methods: { route: o2 } });
} };
createServer(
  (page) => createInertiaApp({
    page,
    render: renderToString,
    title: (title) => title ? `${title} — AniTrack` : "AniTrack",
    resolve: (name) => {
      const pages = /* @__PURE__ */ Object.assign({ "./Pages/Admin/AnimeEditPage.vue": __vite_glob_0_0, "./Pages/Admin/AnimeListPage.vue": __vite_glob_0_1, "./Pages/Admin/DashboardPage.vue": __vite_glob_0_2, "./Pages/Admin/FeatureFlagsPage.vue": __vite_glob_0_3, "./Pages/Admin/JobsPage.vue": __vite_glob_0_4, "./Pages/Admin/RolesPage.vue": __vite_glob_0_5, "./Pages/Admin/UsersPage.vue": __vite_glob_0_6, "./Pages/AlternativesPage.vue": __vite_glob_0_7, "./Pages/AnimeDetailPage.vue": __vite_glob_0_8, "./Pages/AnimeIndexPage.vue": __vite_glob_0_9, "./Pages/DevelopersPage.vue": __vite_glob_0_10, "./Pages/DiscoverPage.vue": __vite_glob_0_11, "./Pages/ErrorPage.vue": __vite_glob_0_12, "./Pages/ImportPage.vue": __vite_glob_0_13, "./Pages/LoginPage.vue": __vite_glob_0_14, "./Pages/MyListPage.vue": __vite_glob_0_15, "./Pages/NotFoundPage.vue": __vite_glob_0_16, "./Pages/PeopleIndexPage.vue": __vite_glob_0_17, "./Pages/PersonDetailPage.vue": __vite_glob_0_18, "./Pages/PlaylistDetailPage.vue": __vite_glob_0_19, "./Pages/PlaylistEditPage.vue": __vite_glob_0_20, "./Pages/PlaylistsIndexPage.vue": __vite_glob_0_21, "./Pages/PrivacyPage.vue": __vite_glob_0_22, "./Pages/ProfilePage.vue": __vite_glob_0_23, "./Pages/PublicListPage.vue": __vite_glob_0_24, "./Pages/RegisterPage.vue": __vite_glob_0_25, "./Pages/SchedulePage.vue": __vite_glob_0_26, "./Pages/SeasonalPage.vue": __vite_glob_0_27, "./Pages/SettingsPage.vue": __vite_glob_0_28, "./Pages/StudioDetailPage.vue": __vite_glob_0_29, "./Pages/StudioIndexPage.vue": __vite_glob_0_30, "./Pages/TermsPage.vue": __vite_glob_0_31, "./Pages/TopAnimePage.vue": __vite_glob_0_32, "./Pages/WelcomePage.vue": __vite_glob_0_33 });
      const page2 = pages[`./Pages/${name}.vue`];
      if (!page2) return pages["./Pages/ErrorPage.vue"];
      return page2;
    },
    setup({ App, props, plugin }) {
      const app = createSSRApp({ render: () => h$1(App, props) });
      app.use(plugin);
      const ziggy = props.initialPage.props.ziggy;
      globalThis.Ziggy = ziggy;
      app.use(U, {
        ...ziggy,
        location: ziggy?.location ? new URL(ziggy.location) : void 0
      });
      globalThis.route = app.config.globalProperties.route;
      app.use(createPinia());
      app.use(VueQueryPlugin);
      app.use(PrimeVue, {
        unstyled: false,
        theme: {
          preset: Aura,
          options: {
            darkModeSelector: ".dark"
          }
        }
      });
      app.use(ToastService);
      app.component("Link", Link);
      app.component("Head", Head);
      return app;
    }
  })
);
