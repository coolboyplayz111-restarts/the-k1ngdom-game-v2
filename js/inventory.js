// Enhanced inventory system

class InventorySystem {
    constructor() {
        this.items = [];
        this.maxSlots = 20;
        this.gold = 0;
    }

    addItem(item) {
        if (this.items.length < this.maxSlots) {
            this.items.push(item);
            this.updateInventoryUI();
            return true;
        }
        return false;
    }

    removeItem(itemId) {
        const index = this.items.findIndex(item => item.id === itemId);
        if (index !== -1) {
            this.items.splice(index, 1);
            this.updateInventoryUI();
            return true;
        }
        return false;
    }

    addGold(amount) {
        this.gold += amount;
        this.updateGoldUI();
    }

    removeGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            this.updateGoldUI();
            return true;
        }
        return false;
    }

    hasItem(itemId) {
        return this.items.some(item => item.id === itemId);
    }

    getItem(itemId) {
        return this.items.find(item => item.id === itemId);
    }

    updateInventoryUI() {
        const inventoryDiv = document.getElementById('inventoryPanel');
        if (!inventoryDiv) return;
        
        inventoryDiv.innerHTML = this.items.map(item => `
            <div class="inventory-item">
                <img src="${item.icon}" alt="${item.name}" class="item-icon">
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-description">${item.description}</div>
                </div>
                <div class="item-quantity">${item.quantity || 1}</div>
            </div>
        `).join('');
    }

    updateGoldUI() {
        const goldCounter = document.getElementById('goldCounter');
        if (goldCounter) {
            goldCounter.textContent = `Gold: ${this.gold}`;
        }
    }

    createItem(id, name, description, icon, quantity = 1) {
        return { id, name, description, icon, quantity };
    }

    createWeapon(name, damage, icon) {
        return this.createItem(
            `weapon_${name.toLowerCase().replace(' ', '_')}`,
            name,
            `Damage: ${damage}`,
            icon,
            1
        );
    }

    createPotion(name, effect, icon) {
        return this.createItem(
            `potion_${name.toLowerCase().replace(' ', '_')}`,
            name,
            effect,
            icon,
            1
        );
    }
}

// Add to global scope
window.inventorySystem = new InventorySystem();
