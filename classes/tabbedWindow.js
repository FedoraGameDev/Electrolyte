"use strict";
const electron = require("electron");
const { ipcMain } = electron;
const Window = require('./window');
const Config = require("../Config.json");
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
                              ondragstart="${this.id}onDragStart(event)"
                              filename="${tabElement.file}"
                              titlename="${tabElement.name}">${tabElement.name}</div>`;
                modules += `<div class="window visual-content ${tabElement.visible}">${module}</div>`;
            });

            ipcMain.on(`userlayout:${this.id}removeTab`, (event, tabIndex) =>
            {
                this.tabs.splice(tabIndex, 1);
            });

            ipcMain.on(`userlayout:${this.id}addTab`, (event, newTab) =>
            {
                console.log(newTab);
                this.tabs.splice(this.tabs.length - 1, 0, [new Tab(newTab.filename, newTab.titlename)]);
            });

            return (`
                <div id="${this.id}" style="height: 100%;">
                    <div class="tab-navigation"
                         style="height: ${Config.TabNavigationHeight}"
                         onclick="${this.id}tabClick(event)"
                         ondrop="${this.id}onDrop(event)"
                         ondragover="${this.id}allowDragover(event)">${tabs}</div>
                    <div class="tabbed-content" style="height: calc(100% - ${Config.TabNavigationHeight})">
                        <div class="tab-modules" style="height: 100%; width: 100%;">${modules}</div>
                        ${this.GetAnchors(layoutId)}
                    </div>
                    <script>
                        if (!${hasChecked})
                        {
                            document.querySelector("%23${this.id}>.tab-navigation>.tab").classList.add("visible");
                            document.querySelector("%23${this.id}>.tabbed-content>.tab-modules>.window").classList.add("visible");
                        }

                        function ${this.id}onDrop(event)
                        {
                            dragData = ${layoutId}getDragTarget();
                            tabInfo = {tabname: dragData.dragTarget.getAttribute("titlename"), tabfile: dragData.dragTarget.getAttribute("filename")};
                            ipcRenderer.send("userlayout:${this.id}addTab", tabInfo);
                            console.log(dragData);
                            ${this.id}resetTabs();
                            index = dragData.dragTarget.getAttribute("index");
                            pathIndex = 1;
                            if (event.target.classList.contains("tab"))
                            {
                                event.target.parentElement.appendChild(dragData.dragTarget);
                                pathIndex++;
                            }
                            else
                                event.target.appendChild(dragData.dragTarget);
                            event.path[pathIndex].querySelector(".tab-modules").appendChild(dragData.dragTargetWindow);
                            document.querySelectorAll(".window.hidden-content").forEach(element => {
                                element.classList.remove("visible");
                            });
                            ${layoutId}setDragTarget(null, null);
                        }

                        function ${this.id}onDragStart(event)
                        {
                            ipcRenderer.send("userlayout:${this.id}removeTab", event.target.getAttribute("index"))
                            ${layoutId}setDragTarget(event.target, event.path[2].querySelectorAll(".tab-modules>.window")[event.target.getAttribute("index")]);
                            document.querySelectorAll(".window.hidden-content").forEach(element => {
                                element.classList.add("visible");
                            });
                        }

                        function ${this.id}allowDragover(event)
                        {
                            event.preventDefault();
                        }

                        function ${this.id}tabClick(event)
                        {
                            index = event.target.getAttribute("index");
                            ${this.id}resetTabs();

                            document.querySelectorAll("%23${this.id}>.tab-navigation>.tab")[index].classList.add("visible");
                            document.querySelectorAll("%23${this.id}>.tabbed-content>.tab-modules>.window")[index].classList.add("visible");
                        }

                        function ${this.id}resetTabs()
                        {
                            tabs = document.querySelectorAll("%23${this.id}>.tab-navigation>.tab");
                            windows = document.querySelectorAll("%23${this.id}>.tabbed-content>.tab-modules>.window");

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
