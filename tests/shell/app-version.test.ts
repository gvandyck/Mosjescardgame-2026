// Phase 64-02: APP_VERSION guard (D-36, SHELL-02). Tests the format, not the exact number, so later bumps never edit this file.
import { describe, it, expect } from 'vitest';
import { APP_VERSION } from '../../src/version.js';

describe('APP_VERSION (D-36, SHELL-02)', () => {
	it('starts with 2.0- so the 2.0 build is never mistaken for V4', () => {
		expect(APP_VERSION.startsWith('2.0-')).toBe(true);
	});

	it('has the format 2.0-<slice letter>.<number>, for example 2.0-A.1', () => {
		expect(APP_VERSION).toMatch(/^2\.0-[A-Z]\.\d+$/);
	});
});
