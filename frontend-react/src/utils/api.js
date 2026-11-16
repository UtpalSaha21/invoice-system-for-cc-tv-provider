const apiFetch = async (url, options = {}) => {
    const token = localStorage.getItem("token");

    const headers = {
        ...options.headers,
    };

    // Automatically attach JWT token
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    // Add JSON content type when sending JSON
    if (
        options.body &&
        !(options.body instanceof FormData) &&
        !headers["Content-Type"]
    ) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    return response;
};

export default apiFetch;
