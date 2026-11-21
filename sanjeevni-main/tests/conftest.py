import httpx

# Compatibility patch for starlette < 0.37 with httpx >= 0.28.0
_orig_httpx_init = httpx.Client.__init__

def _compat_httpx_init(self, *args, **kwargs):
    if "app" in kwargs:
        app = kwargs.pop("app")
        if "transport" not in kwargs:
            kwargs["transport"] = httpx.ASGITransport(app=app)
    return _orig_httpx_init(self, *args, **kwargs)

httpx.Client.__init__ = _compat_httpx_init
