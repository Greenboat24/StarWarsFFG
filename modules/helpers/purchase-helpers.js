import { ActorFFG } from "../actors/actor-ffg.js";
import XPHelpers from "./xp-helpers.js";
export default class XPPurchaseHelpers {


    /**
     * This function adds a purchase to the actor's experience purchases.
     * @param {ActorFFG} actor the actor to add the purchase for
     * @param {number} cost the cost of the purchase
     * @param {string} note an optional note to include with the purchase
     * @param {(uuid: string) => Promise<void>} callback if provided, this callback will be called after the purchase is added, with the uuid of the new purchase as its argument. This is useful if you want to be able to refund the purchase later.
     * @param {string} purchasePath the path to the XP purchase
     * @param {string} purchaseValue the value of the XP purchase
     * @returns {Promise<void>}
     */
    static async addPurchase(actor, cost, note = "", callback, purchasePath = undefined, purchaseValue = undefined) {
        if (!actor || !cost) return;
        if (XPHelpers.getActorAvailableXp(actor) < cost) {
            ui.notifications.error(game.i18n.localize("SWFFG.Errors.NotEnoughXP"));
            return;
        }
        const uuid = foundry.utils.randomID();
        const purchases = actor.system.experience.purchases || [];
        purchases.push({ uuid, cost, note });
        await actor.update({ 'system.experience.purchases': purchases });
        if (purchasePath && purchaseValue) {
            await this.#addPurchaseActiveEffect(actor, purchasePath, purchaseValue, uuid);
        }

        if (callback) await callback(uuid);
    }
    static async #addPurchaseActiveEffect(actor, purchasePath, purchaseValue, uuid) {

        if (!actor || !purchasePath || !purchaseValue || !uuid) return;
        const effectData = {
            name: `purchased-${uuid}`,
            changes: [
                {
                    key: purchasePath,
                    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                    value: purchaseValue,
                }
            ]
        };
        await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
    }
    static async #removePurchaseActiveEffect(actor, uuid) {
        if (!actor || !uuid) return;
        const effects = actor.getEmbeddedCollection("ActiveEffect");
        const purchasedEffect = effects.find(ae => ae.name === `purchased-${uuid}`);
        if (purchasedEffect) {
            await actor.deleteEmbeddedDocuments("ActiveEffect", [purchasedEffect.id]);
        }

    }

    /**
     * 
     * @param {ActorFFG} actor the actor to refund the purchase for
     * @param {string} uuid the uuid of the purchase to refund
     * @returns 
     */
    static async refundPurchase(actor, uuid) {
        if (!actor || !uuid) return;
        const purchases = actor.system.experience.purchases || [];
        const purchase = purchases.find(p => p.uuid === uuid);
        if (!purchase) {
            ui.notifications.error(game.i18n.localize("SWFFG.Errors.PurchaseNotFound"));
            return;
        }
        const updatedPurchases = purchases.filter(p => p.uuid !== uuid);
        await actor.update({ 'system.experience.purchases': updatedPurchases });
        await this.#removePurchaseActiveEffect(actor, uuid);
    }
}
