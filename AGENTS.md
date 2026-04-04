# Instructions for agents

Always run `pnpm build` after every edit to test for build errors. Iterate until there are no build errors. Do not suggest code that has been deleted.

Do not remove any existing comments in the codebase. You can add new comments if necessary, but do not delete any existing comments unless they are no longer relevant. If you need to remove a comment, please explain why in your response.

Use verbose comments to explain your reasoning and the changes you made. This will help other developers understand your thought process and the rationale behind your changes. Follow industry best practices for commenting code, such as using clear and concise language, providing context for your changes, and avoiding unnecessary comments that do not add value to the codebase.

Always use `pnpm` as the package manager for this project. Do not use `npm` or `yarn` unless explicitly instructed to do so. This ensures consistency across the project and avoids potential issues with different package managers.
