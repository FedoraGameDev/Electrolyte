"use strict";
const electron = require("electron");
const { ipcMain } = electron;
const Window = require('./window');
const Tab = require("./tab");
const path = require("path");
const fs = require("fs");

module.exports = class TabbedWindow extends Window
{
    /**
     * Creates a Window with tabs at the top for cycling the contents.
     * If you pass an array of strings, the tabs will be generated
     * automatically.
     * @param {Array<Tab>} tabs 
     */
    constructor(tabs)
    {
        super();
        this.tabs = tabs;
        this.id = "id" + Math.round(Math.random() * 10000000);
        this.GenerateHtml = function (rootPath, layoutId)
        {
            let tabs = "";
            let modules = "";
            let hasChecked = false;

            this.tabs.forEach((element, index) =>
            {
                let tabElement;
                if (typeof (element) === typeof (""))
                    tabElement = new Tab(element);
                else
                    tabElement = element;
                console.log(tabElement);
                if (tabElement.visible === "visible") hasChecked = true;
                let module = fs.readFileSync(path.join(rootPath, tabElement.file), { encoding: "utf-8" });
                tabs += `<div class="tab ${tabElement.visible}"
                              index="${index}"
                              draggable="true"
                              ondragstart="${this.id}onDragStart(event)">${tabElement.name}</div>`;
                modules += `<div class="window visual-content ${tabElement.visible}">${module}</div>`;
            });

            ipcMain.on(`userlayout:${this.id}removeTab`, (event, tabIndex) =>
            {
                this.tabs.splice(tabIndex, 1);
            });

            ipcMain.on(`userlayout:${this.id}addTab`, (event, newTab) =>
            {
                //
            });

            return (`
                <div id="${this.id}">
                    <div class="tab-navigation"
                         onclick="${this.id}tabClick(event)"
                         ondrop="${this.id}onDrop(event)"
                         ondragover="${this.id}allowDragover(event)">${tabs}</div>
                    <div class="tab-modules">${modules}</div>
                    ${this.GetAnchors()}
                    <script>
                        if (!${hasChecked})
                        {
                            document.querySelector("%23${this.id}>.tab-navigation>.tab").classList.add("visible");
                            document.querySelector("%23${this.id}>.tab-modules>.window").classList.add("visible");
                        }

                        function ${this.id}onDrop(event)
                        {
                            ipcRenderer.send("userlayout:${this.id}addTab", event.target);
                            ${layoutId}onDrop(event);
                        }

                        function ${this.id}onDragStart(event)
                        {
                            ipcRenderer.send("userlayout:${this.id}removeTab", event.target.getAttribute("index"))
                            ${layoutId}onDragStart(event);
                        }

                        function ${this.id}allowDragover(event)
                        {
                            ${layoutId}allowDragover(event);
                        }

                        function ${this.id}tabClick(event)
                        {
                            index = event.target.getAttribute("index");
                            ${this.id}resetTabs();

                            document.querySelectorAll("%23${this.id}>.tab-navigation>.tab")[index].classList.add("visible");
                            document.querySelectorAll("%23${this.id}>.tab-modules>.window")[index].classList.add("visible");
                        }

                        function ${this.id}resetTabs()
                        {
                            tabs = document.querySelectorAll("%23${this.id}>.tab-navigation>.tab");
                            windows = document.querySelectorAll("%23${this.id}>.tab-modules>.window");

                            tabs.forEach((element, index) => {
                                element.classList.remove("visible");
                                windows[index].classList.remove("visible");
                            });
                        }
                    </script>
                </div>
            `);
        }
    }

}
