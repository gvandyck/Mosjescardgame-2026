// buildCardSheetContent.js - the dock's content for one card as a DOM fragment (72.1-06, D-06, T-72.1-11). Every text goes through
// textContent, never innerHTML, so a card name or an effect text can never become markup. data = readCardSheetData's result;
// doc is injectable for tests. One div.cs-section[data-section] per section of getCardSheetSections, in order.
import { getCardSheetSections } from './getCardSheetSections.js';

function el(doc, tag, className, text) {
	const node = doc.createElement(tag);
	if (className) node.className = className;
	if (text !== undefined) node.textContent = text;
	return node;
}

function fill(doc, box, section) {
	if (section.id === 'type') {
		box.appendChild(el(doc, 'p', 'cs-type', section.text));
		return;
	}
	if (section.id === 'stats') {
		for (const item of section.items) box.appendChild(el(doc, 'span', 'cs-stat', item));
		return;
	}
	if (section.title) box.appendChild(el(doc, 'h3', 'cs-heading', section.title));
	for (const row of section.rows) {
		const line = el(doc, 'div', `cs-row cs-row--${section.id}`);
		if (section.id === 'attachments') {
			line.appendChild(el(doc, 'b', 'cs-row__name', row.name));
			if (row.text) line.appendChild(el(doc, 'span', 'cs-row__text', row.text));
		} else if (section.id === 'text') {
			line.appendChild(el(doc, 'b', 'cs-row__name', row.label));
			line.appendChild(el(doc, 'span', 'cs-row__text', row.text));
		} else {
			line.dataset.kind = row.kind || '';
			line.textContent = row.text;
		}
		box.appendChild(line);
	}
}

export function buildCardSheetContent(data, doc = document) {
	const root = doc.createElement('div');
	root.className = 'cs-content';
	for (const section of getCardSheetSections(data)) {
		const box = el(doc, 'div', `cs-section cs-section--${section.id}`);
		box.dataset.section = section.id;
		fill(doc, box, section);
		root.appendChild(box);
	}
	return root;
}
