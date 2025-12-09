#!/usr/bin/env node

/**
 * Helper script to guide rule updates
 * Usage: node .cursor/scripts/update-rules.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const RULES_DIR = path.join(__dirname, '..', 'rules');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

function listRules() {
    const files = fs.readdirSync(RULES_DIR)
        .filter(f => f.endsWith('.mdc'))
        .sort();
    
    console.log('\n📝 Available rule files:');
    console.log('─'.repeat(40));
    files.forEach((file, index) => {
        console.log(`${index + 1}. ${file}`);
    });
    console.log('');
    return files;
}

function showStructure(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const headers = lines
        .filter(line => line.match(/^#+\s+/))
        .slice(0, 15)
        .map(line => line.trim());
    
    console.log(`\n📄 Structure of ${path.basename(filePath)}:`);
    console.log('─'.repeat(40));
    headers.forEach(header => {
        const level = (header.match(/^#+/)?.[0] || '').length;
        const indent = '  '.repeat(level - 1);
        const text = header.replace(/^#+\s+/, '');
        console.log(`${indent}${text}`);
    });
    console.log('');
}

function searchRules(term) {
    console.log(`\n🔍 Searching for '${term}'...\n`);
    
    const files = fs.readdirSync(RULES_DIR)
        .filter(f => f.endsWith('.mdc'));
    
    let found = false;
    files.forEach(file => {
        const filePath = path.join(RULES_DIR, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
            if (line.toLowerCase().includes(term.toLowerCase())) {
                if (!found) {
                    found = true;
                }
                const context = lines.slice(Math.max(0, index - 1), index + 2)
                    .map((l, i) => {
                        const lineNum = index - 1 + i;
                        const marker = i === 1 ? '>>>' : '   ';
                        return `${marker} ${lineNum + 1}: ${l}`;
                    })
                    .join('\n');
                console.log(`📄 ${file} (line ${index + 1}):`);
                console.log(context);
                console.log('');
            }
        });
    });
    
    if (!found) {
        console.log('❌ No matches found.\n');
    }
}

async function addRule() {
    const files = listRules();
    
    const fileNum = await question('Which file do you want to update? (enter number): ');
    const selectedIndex = parseInt(fileNum) - 1;
    
    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= files.length) {
        console.log('❌ Invalid selection');
        rl.close();
        return;
    }
    
    const selectedFile = files[selectedIndex];
    const fullPath = path.join(RULES_DIR, selectedFile);
    
    console.log(`\n✅ Selected: ${selectedFile}`);
    showStructure(fullPath);
    
    const section = await question('What section do you want to add to? (enter section name or "new"): ');
    
    console.log('\nEnter your rule (press Enter, then type your rule, then press Enter again):');
    const ruleContent = await question('');
    
    console.log('\n📝 Rule to add:');
    console.log('─'.repeat(40));
    console.log(ruleContent);
    console.log('─'.repeat(40));
    console.log('');
    
    const confirm = await question(`Add this rule to ${selectedFile}? (y/n): `);
    
    if (confirm.toLowerCase() === 'y') {
        console.log('\n✅ Suggested action:');
        console.log(`   File: ${fullPath}`);
        console.log(`   Section: ${section}`);
        console.log('\n💡 You can now:');
        console.log(`   1. Edit manually: code ${fullPath}`);
        console.log(`   2. Ask the AI: "Add this rule to ${selectedFile} in section ${section}: ${ruleContent}"`);
    } else {
        console.log('\n❌ Cancelled.');
    }
}

async function main() {
    console.log('📝 Cursor Rules Update Helper');
    console.log('═'.repeat(40));
    console.log('\nWhat would you like to do?');
    console.log('1. Add a new rule');
    console.log('2. Search existing rules');
    console.log('3. View rule file structure');
    console.log('4. Exit');
    console.log('');
    
    const choice = await question('Enter your choice (1-4): ');
    
    switch (choice) {
        case '1':
            await addRule();
            break;
        case '2':
            const term = await question('Enter search term: ');
            searchRules(term);
            break;
        case '3':
            const files = listRules();
            const fileNum = await question('Which file structure do you want to see? (enter number): ');
            const selectedIndex = parseInt(fileNum) - 1;
            if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < files.length) {
                showStructure(path.join(RULES_DIR, files[selectedIndex]));
            } else {
                console.log('❌ Invalid selection');
            }
            break;
        case '4':
            console.log('\n👋 Goodbye!');
            rl.close();
            return;
        default:
            console.log('❌ Invalid choice');
    }
    
    rl.close();
}

main().catch(console.error);

