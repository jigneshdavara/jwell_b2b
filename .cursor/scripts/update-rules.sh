#!/bin/bash

# Helper script to guide rule updates
# Usage: ./.cursor/scripts/update-rules.sh

RULES_DIR=".cursor/rules"

echo "📝 Cursor Rules Update Helper"
echo "=============================="
echo ""

# Function to list available rule files
list_rules() {
    echo "Available rule files:"
    echo ""
    ls -1 "$RULES_DIR"/*.mdc | sed 's|.*/||' | nl
    echo ""
}

# Function to show file structure
show_structure() {
    local file="$1"
    echo ""
    echo "📄 Structure of $file:"
    echo "----------------------"
    grep -E "^#+ " "$file" | head -20
    echo ""
}

# Function to add rule interactively
add_rule() {
    list_rules
    
    echo "Which file do you want to update? (enter number)"
    read -r file_num
    
    files=($(ls -1 "$RULES_DIR"/*.mdc | sed 's|.*/||'))
    selected_file="${files[$((file_num - 1))]}"
    
    if [ -z "$selected_file" ]; then
        echo "❌ Invalid selection"
        exit 1
    fi
    
    full_path="$RULES_DIR/$selected_file"
    
    echo ""
    echo "✅ Selected: $selected_file"
    show_structure "$full_path"
    
    echo "What section do you want to add to? (enter section name or 'new')"
    read -r section
    
    echo ""
    echo "Enter your rule (press Enter, then type rule, then Ctrl+D to finish):"
    rule_content=$(cat)
    
    echo ""
    echo "📝 Rule to add:"
    echo "$rule_content"
    echo ""
    echo "Add this rule to $selected_file? (y/n)"
    read -r confirm
    
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        echo ""
        echo "⚠️  This script shows you where to add the rule."
        echo "Please manually edit the file or ask the AI to add it."
        echo ""
        echo "Suggested location: $full_path"
        echo "Section: $section"
        echo ""
        echo "You can now:"
        echo "1. Edit the file manually: code $full_path"
        echo "2. Ask the AI: 'Add this rule to $selected_file in section $section: $rule_content'"
    else
        echo "Cancelled."
    fi
}

# Function to search rules
search_rules() {
    echo "Enter search term:"
    read -r search_term
    
    echo ""
    echo "🔍 Searching for '$search_term'..."
    echo ""
    
    grep -r -n "$search_term" "$RULES_DIR"/*.mdc | while IFS=: read -r file line content; do
        filename=$(basename "$file")
        echo "📄 $filename (line $line):"
        echo "   $content"
        echo ""
    done
}

# Main menu
echo "What would you like to do?"
echo "1. Add a new rule"
echo "2. Search existing rules"
echo "3. View rule file structure"
echo "4. Exit"
echo ""
read -r choice

case $choice in
    1)
        add_rule
        ;;
    2)
        search_rules
        ;;
    3)
        list_rules
        echo "Which file structure do you want to see? (enter number)"
        read -r file_num
        files=($(ls -1 "$RULES_DIR"/*.mdc | sed 's|.*/||'))
        selected_file="${files[$((file_num - 1))]}"
        if [ -n "$selected_file" ]; then
            show_structure "$RULES_DIR/$selected_file"
        fi
        ;;
    4)
        echo "Goodbye!"
        exit 0
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac




