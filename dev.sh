#!/bin/bash

# Journey to Citizen - Firebase Development Helper Script

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Journey to Citizen - Dev Helper      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Function to display menu
show_menu() {
    echo "What would you like to do?"
    echo ""
    echo "1) Start Firebase Emulators"
    echo "2) Build Functions"
    echo "3) Watch Functions (auto-rebuild)"
    echo "4) Deploy Functions to Production"
    echo "5) Deploy Firestore Rules"
    echo "6) Deploy Everything"
    echo "7) View Function Logs"
    echo "8) Open Emulator UI"
    echo "9) Run Frontend"
    echo "0) Exit"
    echo ""
}

# Start emulators
start_emulators() {
    echo -e "${GREEN}Starting Firebase Emulators...${NC}"
    echo "This will start Functions, Firestore, Auth, and the UI"
    echo "Emulator UI will be available at: http://localhost:4000"
    echo ""
    firebase emulators:start
}

# Build functions
build_functions() {
    echo -e "${GREEN}Building Firebase Functions...${NC}"
    cd apps/functions/functions
    pnpm build
    echo -e "${GREEN}✓ Build complete!${NC}"
}

# Watch functions
watch_functions() {
    echo -e "${GREEN}Starting Functions watch mode...${NC}"
    echo "Functions will auto-rebuild on changes"
    cd apps/functions/functions
    pnpm dev
}

# Deploy functions
deploy_functions() {
    echo -e "${YELLOW}⚠️  This will deploy to PRODUCTION${NC}"
    echo "Are you sure? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo -e "${GREEN}Deploying functions...${NC}"
        firebase deploy --only functions
        echo -e "${GREEN}✓ Functions deployed!${NC}"
    else
        echo "Deployment cancelled"
    fi
}

# Deploy firestore rules
deploy_rules() {
    echo -e "${YELLOW}⚠️  This will deploy Firestore rules to PRODUCTION${NC}"
    echo "Are you sure? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo -e "${GREEN}Deploying Firestore rules...${NC}"
        firebase deploy --only firestore:rules
        echo -e "${GREEN}✓ Firestore rules deployed!${NC}"
    else
        echo "Deployment cancelled"
    fi
}

# Deploy everything
deploy_all() {
    echo -e "${YELLOW}⚠️  This will deploy EVERYTHING to PRODUCTION${NC}"
    echo "This includes: Functions, Firestore rules, and indexes"
    echo "Are you sure? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo -e "${GREEN}Deploying everything...${NC}"
        firebase deploy
        echo -e "${GREEN}✓ Everything deployed!${NC}"
    else
        echo "Deployment cancelled"
    fi
}

# View logs
view_logs() {
    echo -e "${GREEN}Viewing function logs...${NC}"
    echo "Press Ctrl+C to exit"
    firebase functions:log
}

# Open emulator UI
open_emulator_ui() {
    echo -e "${GREEN}Opening Emulator UI in browser...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open http://localhost:4000
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open http://localhost:4000
    else
        echo "Please open http://localhost:4000 in your browser"
    fi
}

# Run frontend
run_frontend() {
    echo -e "${GREEN}Starting Frontend...${NC}"
    cd apps/frontend
    pnpm start
}

# Main loop
while true; do
    show_menu
    read -r choice
    echo ""
    
    case $choice in
        1) start_emulators ;;
        2) build_functions ;;
        3) watch_functions ;;
        4) deploy_functions ;;
        5) deploy_rules ;;
        6) deploy_all ;;
        7) view_logs ;;
        8) open_emulator_ui ;;
        9) run_frontend ;;
        0) echo "Goodbye!"; exit 0 ;;
        *) echo -e "${YELLOW}Invalid option. Please try again.${NC}"; echo "" ;;
    esac
    
    echo ""
    echo "Press Enter to continue..."
    read -r
    clear
done
