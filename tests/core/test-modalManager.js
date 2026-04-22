import { testAsync, assertEqual, assertTrue } from '../helpers/testHelpers.js';
import { initModalManager } from '../../src/ui/modalManager.js';

export async function runModalManagerTests() {
  console.log('[TEST] Running modalManager tests...');

  await testAsync('showOptionSelect resolves selected option id and renders cancel button', async () => {
    const container = document.createElement('div');
    const modal = initModalManager(container);

    const selectionPromise = modal.showOptionSelect({
      title: 'Choose Type',
      prompt: 'Pick one.',
      options: [
        { id: 'MOSJE', label: 'Mosje' },
        { id: 'PIECIE', label: 'Piecie', metaLabel: 'Item' },
      ],
      allowCancel: true,
    });

    const buttons = container.querySelectorAll('.modal-mosje-select-btn');
    assertEqual(buttons.length, 2, 'Expected two selector buttons');
    assertTrue(!!container.querySelector('#modal-option-cancel'), 'Expected cancel button');

    buttons[1].click();
    const selectedId = await selectionPromise;
    assertEqual(selectedId, 'PIECIE');
  });

  await testAsync('showMosjeSelect preserves synchronous single-slot behavior', async () => {
    const container = document.createElement('div');
    const modal = initModalManager(container);
    let selectedSlot = null;

    modal.showMosjeSelect([
      { slotIndex: 1, name: 'Test Mosje', mp: 42 },
    ], (slotIndex) => {
      selectedSlot = slotIndex;
    });

    assertEqual(selectedSlot, 1, 'Expected immediate callback for single slot');
  });

  await testAsync('showMosjeSelect resolves clicked slot for multiple options', async () => {
    const container = document.createElement('div');
    const modal = initModalManager(container);
    let selectedSlot = null;

    modal.showMosjeSelect([
      { slotIndex: 0, name: 'Alpha', mp: 15 },
      { slotIndex: 1, name: 'Beta', mp: 25 },
    ], (slotIndex) => {
      selectedSlot = slotIndex;
    });

    const buttons = container.querySelectorAll('.modal-mosje-select-btn');
    assertEqual(buttons.length, 2, 'Expected two Mosje selector buttons');

    buttons[1].click();
    await new Promise(resolve => setTimeout(resolve, 0));

    assertEqual(selectedSlot, 1, 'Expected second Mosje slot after click');
  });

  await testAsync('showCardTypeSelect renders canonical labels and resolves selected type id', async () => {
    const container = document.createElement('div');
    const modal = initModalManager(container);

    const selectionPromise = modal.showCardTypeSelect({
      title: 'Card Type Test',
      prompt: 'Pick a type.',
      allowedTypes: ['MOSJE', 'SNELLE_PIECIE', 'QUEST_PERSONAL'],
      allowCancel: true,
    });

    const buttons = container.querySelectorAll('.modal-mosje-select-btn');
    assertEqual(buttons.length, 3, 'Expected three card-type buttons');
    assertTrue(container.textContent.includes('Mosje'), 'Expected Mosje label to be rendered');
    assertTrue(container.textContent.includes('Snelle Piecie'), 'Expected Snelle Piecie label to be rendered');
    assertTrue(container.textContent.includes('Personal Quest'), 'Expected Personal Quest label to be rendered');

    buttons[1].click();
    const selectedType = await selectionPromise;
    assertEqual(selectedType, 'SNELLE_PIECIE', 'Expected canonical type id from selection');
  });

  await testAsync('showCardTypeSelect ignores unknown type ids', async () => {
    const container = document.createElement('div');
    const modal = initModalManager(container);

    const selectionPromise = modal.showCardTypeSelect({
      allowedTypes: ['UNKNOWN_TYPE', 'PIECIE'],
      allowCancel: false,
    });

    const buttons = container.querySelectorAll('.modal-mosje-select-btn');
    assertEqual(buttons.length, 1, 'Expected only known type options to render');
    assertTrue(container.textContent.includes('Piecie'), 'Expected known type label to be rendered');

    buttons[0].click();
    const selectedType = await selectionPromise;
    assertEqual(selectedType, 'PIECIE', 'Expected known canonical type id');
  });

  await testAsync('showOpponentHandCardSelect renders hidden cards and resolves selected index', async () => {
    const container = document.createElement('div');
    const modal = initModalManager(container);

    const selectionPromise = modal.showOpponentHandCardSelect({
      title: 'Select Hidden Card',
      prompt: 'Pick one.',
      handSize: 3,
      allowCancel: true,
    });

    const buttons = container.querySelectorAll('.modal-mosje-select-btn');
    assertEqual(buttons.length, 3, 'Expected three hidden-card options');
    assertTrue(container.textContent.includes('Card 3'), 'Expected card index labels to render');

    buttons[2].click();
    const selectedIndex = await selectionPromise;
    assertEqual(selectedIndex, 2, 'Expected selected hidden card index');
  });

  await testAsync('showOpponentHandCardSelect returns null for empty hand', async () => {
    const container = document.createElement('div');
    const modal = initModalManager(container);

    const selectedIndex = await modal.showOpponentHandCardSelect({ handSize: 0 });
    assertEqual(selectedIndex, null, 'Expected null when no hidden cards are available');
    assertEqual(container.querySelectorAll('.modal-mosje-select-btn').length, 0, 'Expected no modal options rendered');
  });
}