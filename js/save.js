'use strict';
const Save = (() => {
  const KEY = 'tokyo_shacho_save';

  function write(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function remove() {
    localStorage.removeItem(KEY);
  }

  function hasSave() {
    return read() !== null;
  }

  // Cookie Clicker-style: export as Base64 string
  function exportCode() {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return btoa(unescape(encodeURIComponent(raw)));
  }

  // Import from Base64 string
  function importCode(code) {
    try {
      const json = decodeURIComponent(escape(atob(code.trim())));
      const data = JSON.parse(json);
      // basic validation
      if (!data.name || typeof data.day !== 'number') throw new Error('invalid');
      write(data);
      return true;
    } catch {
      return false;
    }
  }

  return { write, read, remove, hasSave, exportCode, importCode };
})();
