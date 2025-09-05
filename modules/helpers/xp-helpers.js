export default class XPHelpers { 
    /**
     * 
     * @param {ActorFFG} actor 
     * @param {number} amount 
     * @param {(updatedTotalXP: number, updatedAvailableXP: number) => Promise<void>} callback 
     * @returns {Promise<void>}
     */
    static async changeActorXpAsync(actor, amount, callback) {
        if (!actor || !amount) return;
        const availableXp = parseInt(actor.system.experience.available);
        const newXp = availableXp + parseInt(amount);
        await actor.update({ 'system.experience.available': newXp });
        const totalXp = parseInt(actor.system.experience.total) + parseInt(amount);
        await actor.update({ 'system.experience.total': totalXp });
        if (callback) await callback(totalXp, newXp);
    }
    /**
     * This function calculates the available XP for an actor by subtracting the total spent XP on purchases from the total earned XP.
     * @param {ActorFFG} actor 
     * @returns {number}
     * 
     */
    static getActorAvailableXp(actor) {
        if (!actor || !actor.system?.experience?.total) return 0;
        const totalXp = parseInt(actor.system.experience.total) || 0;
        const purchases = actor.system.experience.purchases || [];
        const spentXp = purchases.reduce((acc, purchase) => acc + (parseInt(purchase.cost) || 0), 0);
        return totalXp - spentXp;
    }
}
