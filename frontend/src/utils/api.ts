const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

interface RequestOptions extends RequestInit {
    headers?: Record<string, string>;
}

export const apiFetch = async (endpoint: string, options: RequestOptions = {}) => {
    const cleanEndpoint = endpoint.replace(/^\//, '');
    
    let url: string;
    if (cleanEndpoint.startsWith('http')) {
        url = cleanEndpoint;
    } else if (cleanEndpoint.startsWith('dj-rest-auth')) {
        url = `http://localhost:8001/${cleanEndpoint}`;
    } else {
        const path = cleanEndpoint.startsWith('api/') ? cleanEndpoint.replace(/^api\//, '') : cleanEndpoint;
        url = `${API_BASE_URL}/${path}`;
    }

    const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const config: RequestOptions = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
        credentials: 'include',
        signal: controller.signal,
    };

    try {
        const response = await fetch(url, config);
        clearTimeout(timeoutId);
        return response;
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.error(`API Fetch TIMEOUT [${url}]`);
        } else {
            console.error(`API Fetch Error [${url}]:`, error);
        }
        throw error;
    }
};
