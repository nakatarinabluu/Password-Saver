# Pillar 12: Engineering Productivity (DevEx)
# "Treating developers as customers" - Automated common tasks

.PHONY: dev build test chaos clean setup

# Default Development Mode
dev:
	@echo "🚀 Starting Dev Server..."
	npm run dev

# Production Build
build:
	@echo "🏗️ Building for Production..."
	npm run build

# Run Chaos Engineering Tests (Pillar 6)
chaos:
	@echo "🔥 Running Chaos Engineering Tests..."
	npx tsx scripts/chaos_test.ts

# View Recent Logs (Pillar 9)
logs:
	@echo "🔍 Reading Logs..."
	npx tsx scripts/view_logs.ts

# Run Dual-Sharding Verification (Pillar 3)
test:
	@echo "🧪 Running Sharding Tests..."
	npx tsx test-dual-refactor.ts

# Clean Dependencies
clean:
	@echo "🧹 Cleaning up..."
	rm -rf .next node_modules

# First Time Setup
setup:
	@echo "🛠️ Installing Dependencies..."
	npm install
	@echo "✅ Setup Complete. Run 'make dev' to start."
