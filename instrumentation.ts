import { init } from '@/lib/env.server' // startup env var check

export function register() {
	if (typeof window === "undefined") {
		init()
	}
}