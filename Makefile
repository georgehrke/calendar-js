all: dev-setup lint test

# Development environment
dev-setup: clean npm-init

npm-init:
	npm install

# Cleaning
clean:
	rm -rf node_modules
	rm -rf dist

# Testing
test:
	npm run test

test-coverage:
	npm run test:coverage

# Linting
lint:
	npm run lint

lint-fix:
	npm run lint:fix
