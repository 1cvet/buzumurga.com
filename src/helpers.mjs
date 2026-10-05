// Small HTML helpers shared by the templates.

export function esc(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export const attr = esc;

// Attributes for links that leave the site.
export const ext = ' target="_blank" rel="noopener"';

// Minimal inline markup for content strings: [text](https://url) and *emphasis*.
export function md(value) {
    return esc(value)
        .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_, text, href) => `<a href="${href}"${ext}>${text}</a>`)
        .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

export function initials(name) {
    return name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
}

// The email address is not written to the HTML as plain text:
// it is reversed and base64-encoded, js/main.js decodes it.
export function obfuscate(email) {
    return Buffer.from([...email].reverse().join(''), 'utf8').toString('base64');
}
