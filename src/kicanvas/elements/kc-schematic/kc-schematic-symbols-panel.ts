/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { sorted_by_numeric_strings } from "../../../base/array";
import { WithContext } from "../../../base/dom/context";
import { CustomElement, html } from "../../../base/dom/custom-element";
import common_styles from "../../../kc-ui/common-styles";
import { KCUIFilteredListElement } from "../../../kc-ui/kc-ui-filtered-list";
import type {
    KCUIMenuElement,
    KCUIMenuItemElement,
} from "../../../kc-ui/kc-ui-menu";
import { KCUITextFilterInputElement } from "../../../kc-ui/kc-ui-text-filter-input";
import {
    KiCanvasLoadEvent,
    KiCanvasSelectEvent,
} from "../../../viewers/base/events";
import { SchematicViewer } from "../../../viewers/schematic/viewer";

import "../../../kc-ui/kc-ui-filtered-list";
import "../../../kc-ui/kc-ui-menu";
import "../../../kc-ui/kc-ui-panel";
import "../../../kc-ui/kc-ui-text-filter-input";

export class KCSchematicSymbolsPanelElement extends WithContext(CustomElement) {
    static override styles = [common_styles];

    viewer: SchematicViewer;

    private get menu() {
        return this.$<KCUIMenuElement>("kc-ui-menu")!;
    }

    override connectedCallback() {
        (async () => {
            this.viewer = await this.requestLazyContext("viewer");
            await this.viewer.loaded;
            super.connectedCallback();
            this.setup_initial_events();
        })();
    }

    private setup_initial_events() {
        this.addEventListener("kc-ui-menu:select", (e) => {
            const item = (e as CustomEvent).detail as KCUIMenuItemElement;

            if (!item.name) {
                return;
            }

            this.viewer.select(item.name);
        });

        // Update the selected item in the list whenever the viewer's
        // selection changes.
        this.addDisposable(
            this.viewer.addEventListener(KiCanvasSelectEvent.type, () => {
                this.menu.selected = this.viewer.selected?.context.uuid ?? null;
            }),
        );

        // Re-render the entire component if a different schematic gets loaded.
        this.addDisposable(
            this.viewer.addEventListener(KiCanvasLoadEvent.type, () => {
                this.update();
            }),
        );
    }

    override renderedCallback() {
        // Wire up search to filter the list
        this.search_input_elm.addEventListener("input", (e) => {
            this.item_filter_elem.filter_text =
                this.search_input_elm.value ?? null;
        });
    }

    private get search_input_elm() {
        return this.$<KCUITextFilterInputElement>("kc-ui-text-filter-input")!;
    }

    private get item_filter_elem() {
        return this.$<KCUIFilteredListElement>("kc-ui-filtered-list")!;
    }

    override render() {
        const schematic = this.viewer.schematic;
        const symbol_elms: HTMLElement[] = [];
        const power_symbol_elms: HTMLElement[] = [];

        const symbols = sorted_by_numeric_strings(
            schematic.symbols,
            (sym) => sym.reference,
        );

        for (const sym of symbols) {
            const match_text = `${sym.reference} ${sym.value} ${sym.id} ${sym.lib_symbol.name}`;
            const entry = html`<kc-ui-menu-item
                name="${sym.uuid}"
                data-match-text="${match_text}">
                <span class="narrow"> ${sym.reference} </span>
                <span> ${sym.value} </span>
            </kc-ui-menu-item>` as HTMLElement;

            if (sym.lib_symbol.power) {
                power_symbol_elms.push(entry);
            } else {
                symbol_elms.push(entry);
            }
        }

        return html`
            <kc-ui-panel>
                <kc-ui-panel-title title="Symbols"></kc-ui-panel-title>
                <kc-ui-panel-body>
                    <kc-ui-text-filter-input></kc-ui-text-filter-input>
                    <kc-ui-filtered-list>
                        <kc-ui-menu class="outline">
                            ${symbol_elms}
                            <kc-ui-menu-label>Power symbols</kc-ui-menu-label>
                            ${power_symbol_elms}
                        </kc-ui-menu>
                    </kc-ui-filtered-list>
                </kc-ui-panel-body>
            </kc-ui-panel>
        `;
    }
}

window.customElements.define(
    "kc-schematic-symbols-panel",
    KCSchematicSymbolsPanelElement,
);
