sap.ui.define(
  ["sap/ui/core/mvc/Controller",
    "sap/ui/export/Spreadsheet",
    "sap/ui/export/library",
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (Controller, Spreadsheet) {
    "use strict";

    var that, validList = [], allDate;
    return Controller.extend("salesorder.controller.View1", {
      onInit: function () {
        that = this;
        that.suggestDialog = that.loadFragment({
          name: "salesorder.view.suggest",
        });
        that.uniqueDialog = that.loadFragment({
          name: "salesorder.view.uniqueid",
        });
        that.orderDialog = that.loadFragment({
          name: "salesorder.view.order",
        });
        that.datePicker = that.loadFragment({
          name: "salesorder.view.DatePicker",
        });
        that.errorTable = that.loadFragment({
          name: "salesorder.view.errorTable",
        });
        that
          .byId("table")
          .setModel(new sap.ui.model.json.JSONModel({ salesOrder: [] }));
      },
      go: function () {
        const to = that.byId("date").getTo();
        const from = that.byId("date").getFrom();
        that.byId("search").setValue("");
        let product = that.byId("input").getValue();
        let uniqueId = that.byId("uniqueIDinput").getValue();
        if (!product) {
          return sap.m.MessageToast.show("Select a PRODUCT");
        }
        if (!uniqueId) {
          return sap.m.MessageToast.show("Select a ID");
        }
        const oTable = that.byId("table");
        const oModel = that.getOwnerComponent().getModel();
        oModel.read("/SEED_ORDER", {
          success: function (data) {
            let items = data.results;
            items = data.results.filter((obj) => {
              return (obj.PRODUCT === product) && (obj.UNIQUE_ID === uniqueId);
            });
            // if (uniqueId) {
            //   items = items.filter((obj) => {
            //     return obj.UNIQUE_ID === uniqueId;
            //   });
            // }
            if (from && to) {
              items = items.filter((obj) => {
                return (
                  new Date(obj.CREADTED_DATE) >= new Date(from) &&
                  new Date(obj.CREADTED_DATE) <= new Date(to)
                );
              });
            }
            const model = new sap.ui.model.json.JSONModel();
            model.setData({
              salesOrder: items,
            });
            oTable.setModel(model);
            var OTable = that.byId("table");
            OTable.setModel(model);
            var oFirstItem = oTable.getItems()[0];
            if (oFirstItem) {
              OTable.setSelectedItem(oFirstItem);
              that.onselect();
            }
          },
          error: function (error) {
            console.log(error);
          },
        });
      },
      onValueHelpDialogSearch: function (oEvent) {
        var sValue = oEvent.getParameter("value");
        var oFilter = new sap.ui.model.Filter(
          "PRODUCT_ID",
          sap.ui.model.FilterOperator.Contains,
          sValue
        );
        oEvent.getSource().getBinding("items").filter(oFilter);
      },
      onValueHelpDialogSearch1: function (oEvent) {
        var sValue = oEvent.getParameter("value");
        var oFilter = new sap.ui.model.Filter(
          "UNIQUE_ID",
          sap.ui.model.FilterOperator.Contains,
          sValue
        );
        oEvent.getSource().getBinding("items").filter(oFilter);
      },
      onValueHelpRequest: function () {
        if (!that.suggestDialog) {
          that.suggestDialog = that.loadFragment({
            name: "salesorder.view.suggest",
          });
        }
        that.suggestDialog.then((dialog) => {
          dialog.open();
        })
          .then(() => {
            const oModel = that.getOwnerComponent().getModel();
            oModel.read("/UNIQUE_ID_HEADER", {
              success: async function (data) {
                let datas = [];
                data.results.forEach((obj) => {
                  if (!datas.includes(obj.PRODUCT_ID)) {
                    datas.push(obj.PRODUCT_ID);
                  }
                });
                const PRODUCT_ID = datas.map((item) => {
                  return {
                    PRODUCT_ID: item,
                  };
                });
                const model = new sap.ui.model.json.JSONModel();
                await model.setData({
                  PRODUCT_ID: PRODUCT_ID,
                });
                that.byId("selectDialog").setModel(model);
              },
              error: function (error) {
                console.log(error);
              },
            });
          })
      },
      onValueHelpRequest1: function () {
        let product;
        if (that.byId("orderDialog").isOpen()) {
          product = that.byId("orderProduct").getValue();
        } else {
          product = that.byId("input").getValue();
        }
        if (!product) {
          return sap.m.MessageToast.show("Select a PRODUCT");
        }
        if (!that.uniqueDialog) {
          that.uniqueDialog = that.loadFragment({
            name: "salesorder.view.uniqueid",
          });
        }
        that.uniqueDialog.then((dialog) => {
          dialog.open();
        });
        const oModel = that.getOwnerComponent().getModel();
        oModel.read("/UNIQUE_ID_HEADER", {
          success: async function (data) {
            let items = data.results;
            items = items.filter((obj) => obj.PRODUCT_ID === product);
            const model = new sap.ui.model.json.JSONModel();
            await model.setData({
              UNIQUE_ID: items.map((obj) => {
                return { UNIQUE_ID: obj.UNIQUE_ID + "" };
              }),
            });
            that.byId("uniqueDialog").setTitle(product);
            that.byId("uniqueDialog").setModel(model);
          },
          error: function (error) {
            console.log(error);
          },
        });
      },
      onValueHelpDialogClose: function (oEvent) {
        var oSelectedItem = oEvent.getParameter("selectedItem");
        if (!oSelectedItem) {
          return;
        }
        const title = oSelectedItem.getTitle();
        if (that.byId("orderDialog").isOpen()) {
          that.byId("orderProduct").setValue(title);
          that.byId("uniqueIDOrder").setValue("");
        } else {
          that.byId("input").setValue(title);
          that.byId("uniqueIDinput").setValue("");
        }
      },
      onValueHelpDialogClose1: function (oEvent) {
        var oSelectedItem = oEvent.getParameter("selectedItem");
        if (!oSelectedItem) {
          return;
        }
        const title = oSelectedItem.getTitle();
        if (that.byId("orderDialog").isOpen()) {
          that.byId("uniqueIDOrder").setValue(Number(title));
        } else {
          that.byId("uniqueIDinput").setValue(Number(title));
        }
      },
      onSearch: function (oEvent) {
        var sValue = that.getView().byId("search").getValue();
        var table = that.getView().byId("table");
        var oBinding = table.getBinding("items");
        var filter = new sap.ui.model.Filter(
          [
            new sap.ui.model.Filter(
              "UNIQUE_ID",
              sap.ui.model.FilterOperator.Contains,
              sValue
            ),
            new sap.ui.model.Filter(
              "SEEDORDER",
              sap.ui.model.FilterOperator.Contains,
              sValue
            ),
          ],
          false
        );
        oBinding.filter(filter);
      },
      pressOrderNow: async function () {
        if (!that.orderDialog) {
          that.orderDialog = that.loadFragment({
            name: "salesorder.view.order",
          });
        }
        await that.orderDialog.then((dialog) => {
          dialog.open();
        });
      },
      orderNow: function () {
        const oModel = that.getOwnerComponent().getModel();
        const PRODUCT = that.byId("orderProduct").getValue();
        const UNIQUE_ID = that.byId("uniqueIDOrder").getValue();
        const ORDER_QUANTITY = Number(that.byId("orderQuantity").getValue());
        const MATERIAL_AVAIL_DATE = that.byId("materialDate").getValue();
        if (!PRODUCT) {
          that.byId("orderProduct").setValueState(sap.ui.core.ValueState.Error);
          return sap.m.MessageToast.show("GIVE A VALID PRODUCT");
        }
        that.byId("orderProduct").setValueState(sap.ui.core.ValueState.Success);
        if (!UNIQUE_ID) {
          that.byId("uniqueIDOrder").setValueState(sap.ui.core.ValueState.Error);
          return sap.m.MessageToast.show("GIVE A VALID UNIQUE_ID");
        }
        that.byId("uniqueIDOrder").setValueState(sap.ui.core.ValueState.Success);
        if (!ORDER_QUANTITY || ORDER_QUANTITY === 0) {
          that.byId("orderQuantity").setValueState(sap.ui.core.ValueState.Error);
          return sap.m.MessageToast.show("GIVE A VALID ORDER_QUANTITY");
        }
        that.byId("orderQuantity").setValueState(sap.ui.core.ValueState.Success);
        if (!new Date(MATERIAL_AVAIL_DATE).getDay()) {
          that.byId("materialDate").setValueState(sap.ui.core.ValueState.Error);
          return sap.m.MessageToast.show("GIVE A VALID MATERIAL_AVAIL_DATE");
        }
        that.byId("materialDate").setValueState(sap.ui.core.ValueState.Success);
        oModel.callFunction("/order", {
          method: "GET",
          urlParameters: {
            FLAG: "C",
            PRODUCT: PRODUCT,
            UNIQUE_ID: UNIQUE_ID,
            ORDER_QUANTITY: ORDER_QUANTITY,
            MATERIAL_AVAIL_DATE: MATERIAL_AVAIL_DATE,
            CREADTED_DATE: new Date().toLocaleDateString(),
            CREATED_BY: "",
          },
          success: function (message) {
            if (!message.order.startsWith("SE000")) {
              if (message.order.includes("ON")) that.byId("materialDate").setValueState(sap.ui.core.ValueState.Error);
              else {
                that.byId("uniqueIDOrder").setValueState(sap.ui.core.ValueState.Error);
                that.byId("orderProduct").setValueState(sap.ui.core.ValueState.Error);
              }
              sap.m.MessageToast.show(
                message.order
              );
            } else {
              that.byId("input").setValue(PRODUCT);
              that.byId("uniqueIDinput").setValue(UNIQUE_ID);
              that.byId("date").setFrom(new Date(new Date().setHours(0, 0, 0, 0)));
              that.byId("date").setTo(new Date(new Date().setHours(23, 59, 59, 59)));
              that.go();
              sap.m.MessageToast.show(
                `${message.order} HAS BEEN CREATED SUCCESSFULLY`
              );
              that.onCloseOrder();
            }
          },
          error: function (error) {
            console.log(error);
            sap.m.MessageToast.show("Create Failed");
          },
        });
      },
      checkOrderQuantity: function (oEvent) {
        var input = oEvent.getSource(),
          val = input.getValue();
        val = val.replace(/[^\d]/g, "");
        input.setValue(val);
      },
      onselect: function (oEvent) {
        const objModel = that.getOwnerComponent().getModel("OBJ");
        var obj = that
          .byId("table")
          .getSelectedItem()
          .getBindingContext()
          .getObject();
        that.getOwnerComponent().getModel("OBJ").setProperty("/", obj);
      },
      onCloseOrder: function () {
        that.byId("orderProduct").setValueState(sap.ui.core.ValueState.None);
        that.byId("uniqueIDOrder").setValueState(sap.ui.core.ValueState.None);
        that.byId("orderQuantity").setValueState(sap.ui.core.ValueState.None);
        that.byId("materialDate").setValueState(sap.ui.core.ValueState.None);
        that.byId("uniqueIDOrder").setValue("");
        that.byId("orderProduct").setValue("");
        that.byId("orderQuantity").setValue("");
        that.byId("materialDate").setValue("");
        that.byId("orderDialog").close();
      },
      reset: function () {
        that.byId("input").setValue("");
        that.byId("search").setValue("");
        that.byId("uniqueIDinput").setValue("");
        that.byId("date").setValue("");
        that.byId("fileUpload").setValue("");
        that.byId("table").setModel(new sap.ui.model.json.JSONModel({ salesOrder: [] }));
      },
      checkOrderQuantity: function (oEvent) {
        var input = oEvent.getSource(),
          val = input.getValue();
        val = val.replace(/[^\d]/g, "");
        input.setValue(val);
      },
      ondownloadTemplete: function () {
        that.datePicker
          .then(dialog => {
            dialog.open()
          })
      },
      onCloseDate: function () {
        that.byId("dateRange").setValue("");
        that.byId("templeteName").setValue("");
        that.byId("templeteName").setValueState(sap.ui.core.ValueState.None);
        that.byId("dateRange").setValueState(sap.ui.core.ValueState.None);
        that.byId("dateDialog").close();
      },
      downloadTemplete: function () {
        const from = new Date(that.byId("dateRange").getFrom());
        const to = new Date(that.byId("dateRange").getTo());
        const name = that.byId("templeteName").getValue();
        if (!(that.byId("dateRange").getFrom())) {
          that.byId("dateRange").setValueState(sap.ui.core.ValueState.Error);
          return sap.m.MessageToast.show("GIVEN A RANGE");
        }
        that.byId("dateRange").setValueState(sap.ui.core.ValueState.Success);
        if (!name) {
          that.byId("templeteName").setValueState(sap.ui.core.ValueState.Error);
          return sap.m.MessageToast.show("GIVEN A NAME");
        }
        that.byId("templeteName").setValueState(sap.ui.core.ValueState.Success);
        const tempFrom = from;
        const startDay = tempFrom.getDay();
        const monDays = [];
        if (startDay === 1) {
          monDays.push(tempFrom.toDateString());
        } else {
          var temp;
          if (startDay === 0) {
            temp = 1;
          } else {
            temp = 8 - startDay
          }
          tempFrom.setDate(tempFrom.getDate() + (temp))
          monDays.push(tempFrom.toDateString());
        }
        while (tempFrom <= to) {
          tempFrom.setDate(tempFrom.getDate() + 7);
          monDays.push(tempFrom.toDateString());
        }
        monDays.unshift("PRODUCT", "UNIQUE_ID");
        var aCols, oSettings, oSheet;
        aCols = that.createColumnConfig(monDays);
        oSettings = {
          workbook: {
            columns: aCols,
          },
          dataSource: [],
          fileName: `${name}.xlsx`,
          worker: true,
        };
        oSheet = new Spreadsheet(oSettings);
        oSheet.build().finally(function () {
          oSheet.destroy();
          that.onCloseDate();
        });
      },
      upload: function (oEvent) {
        //that.byId("table").setModel(new sap.ui.model.json.JSONModel({ salesOrder: [] }));
        var excelData = {};
        validList = [];
        var file = this.byId("fileUpload").oFileUpload.files[0];
        if (!file) {
          return sap.m.MessageToast.show("SELECT A EXCEL FILE");
        }
        this.byId("fileUpload").setValue("");
        var reader = new FileReader();
        reader.onload = function (e) {
          var data = e.target.result;
          var workbook = XLSX.read(data, {
            type: "binary"
          });
          workbook.SheetNames.forEach(function (sheetName) {
            excelData = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
            allDate = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName], { header: 1 })[0].filter(date => date !== "PRODUCT" && date !== "UNIQUE_ID");
            that.excelOrder(excelData);
          });
        };
        reader.readAsBinaryString(file);
      },
      createColumnConfig: function (list) {
        var aCols = [];
        var noOfColumn = list.length;
        for (let i = 0; i < noOfColumn; i++) {
          const temp = {
            property: list[i],//property: list[i].split(' ').join('_')
          }
          if (list[i] != "PRODUCT") {
            temp.type = sap.ui.export.EdmType.Number
          }
          aCols.push(temp);
        }
        return aCols;
      },
      excelOrder: async function (catchData) {
        //validDataFunction Start
        let SEED_ORDER, HEADER_ITEM;
        that.getOwnerComponent().getModel()
          .read("/SEED_ORDER", {
            success: function (seedorder) {
              SEED_ORDER = seedorder.results;
              that.getOwnerComponent().getModel()
                .read("/UNIQUE_ID_HEADER", {
                  success: function (headeritem) {
                    HEADER_ITEM = headeritem.results;
                    const dub = [];
                    const data = [];
                    catchData.forEach(obj => {
                      if (!(dub.includes(obj.UNIQUE_ID))) {
                        data.push(obj)
                      }
                      dub.push(obj.UNIQUE_ID);
                    })
                    data.forEach(async row => {
                      var PRODUCT = row.PRODUCT;
                      var UNIQUE_ID = row.UNIQUE_ID;
                      const temp = {
                        PRODUCT: PRODUCT,
                        UNIQUE_ID: UNIQUE_ID,
                      }
                      const thisDate = [];
                      allDate.forEach(async date => {
                        var orderQuanrity = row[date];
                        temp[date.split(' ').join('_')] = orderQuanrity ? orderQuanrity : "_";//date format depend
                        thisDate.push(orderQuanrity ? orderQuanrity : "_")
                      })
                      const DATES = Object.keys(temp).filter(_date => _date !== "PRODUCT" && _date !== "UNIQUE_ID");
                      if (!temp.PRODUCT) {
                        temp.TYPE = "INVALID"
                        temp.REASON = "NULL_PRODUCT"
                      }
                      else if (!temp.UNIQUE_ID) {
                        temp.TYPE = "INVALID"
                        temp.REASON = "NULL_ID"
                      }
                      else if (thisDate.find(value => value === "_")) {
                        temp.TYPE = "INVALID"
                        temp.REASON = "NULL"
                      } else if (thisDate.find(value => !Number(value))) {
                        temp.TYPE = "INVALID"
                        temp.REASON = "String TYPE"
                      } else if (!HEADER_ITEM.find(obj => obj.PRODUCT_ID === temp.PRODUCT && obj.UNIQUE_ID == temp.UNIQUE_ID)) {
                        temp.TYPE = "INVALID"
                        temp.REASON = "INVALID_ID"
                      }
                      else if (SEED_ORDER.find(obj => ((obj.UNIQUE_ID == temp.UNIQUE_ID) && DATES.includes(new Date(obj.MATERIAL_AVAIL_DATE).toDateString().split(" ").join("_"))))) {
                        temp.TYPE = "INVALID"
                        temp.REASON = "ALREADY_EXIST"
                      } else {
                        temp.TYPE = "VALID"
                        temp.REASON = "_"
                      }
                      validList.push(temp)
                    })

                    const find = validList.find(obj => obj.TYPE === "INVALID")
                    if (find) {
                      that.errorTable
                        .then(dialog => {
                          dialog.open();
                          that.byId("table2").setModel(new sap.ui.model.json.JSONModel({ items: validList }));
                          sap.m.MessageToast.show("BROWSE FAILED");
                          that.bindModel(validList, that.byId("table2"));
                          that.byId("typeSelect").setModel(new sap.ui.model.json.JSONModel({ types: [{ type: "ALL" }, { type: "VALID" }, { type: "INVALID" }] }));
                          that.byId("reasonSelect").setModel(new sap.ui.model.json.JSONModel({
                            reason:
                              [{ reason: "ALL" }, { reason: "NULL" }, { reason: "NULL_PRODUCT" }, { reason: "NULL_ID" }, { reason: "String TYPE" }, { reason: "INVALID_ID" }, { reason: "ALREADY_EXIST" }]
                          }));
                        })
                    }
                    else {
                      validList = [];
                      const dub = [];
                      const data = [];
                      catchData.forEach(obj => {
                        if (!(dub.includes(obj.UNIQUE_ID))) {
                          data.push(obj)
                        }
                        dub.push(obj.UNIQUE_ID);
                      })
                      const allOrders = [];
                      const oModel = that.getOwnerComponent().getModel();
                      //start
                      if (data.length === 0) {
                        return sap.m.MessageToast.show("THE EXCEL IS EMPTY");
                      }
                      data.forEach(async row => {
                        var key = Object.keys(row);
                        var dates = key.filter(item => new Date(item.split('_').join('/')).getDay());
                        var PRODUCT = row.PRODUCT;
                        var UNIQUE_ID = row.UNIQUE_ID;
                        if (PRODUCT && UNIQUE_ID) {
                          dates.forEach(async date => {
                            var MATERIAL_AVAIL_DATE = new Date(date.split('_').join(' ')).toLocaleDateString();
                            var orderQuanrity = row[date];
                            if (Number(orderQuanrity)) {
                              allOrders.push(
                                {
                                  PRODUCT: PRODUCT,
                                  UNIQUE_ID: UNIQUE_ID + '',
                                  ORDER_QUANTITY: Number(orderQuanrity),
                                  MATERIAL_AVAIL_DATE: MATERIAL_AVAIL_DATE,
                                  CREADTED_DATE: new Date().toLocaleDateString(),
                                }
                              )
                            }
                          })
                        }
                      })
                      //end
                      if (allOrders.length === 0) {
                        return sap.m.MessageToast.show("THE EXCEL DON'T HAVE ANY VALID DATA");
                      }
                      oModel.callFunction("/excelorder", {
                        method: "GET",
                        urlParameters: {
                          FLAG: "C",
                          OBJ: JSON.stringify(allOrders)
                        },
                        success: async function (data) {
                          const message = [];
                          var msg1;
                          if (JSON.parse(data.excelorder)[0].length !== 0) {
                            JSON.parse(data.excelorder)[0].forEach(
                              item => {
                                if (!message.includes(item.UNIQUE_ID))
                                  message.push(item.UNIQUE_ID);
                              }
                            )
                            msg1 = "ID " + [...new Set(message)].join(',') + " CREATED.";
                          }
                          sap.m.MessageToast.show(msg1, { duration: 2000 });
                        },
                        error: function (error) {
                          console.log(error);
                          sap.m.MessageToast.show("Create Failed");
                        },
                      });
                    }
                  },
                  error: function (error) {
                    console.log(error);
                  }
                })
            },
            error: function (error) {
              console.log(error);
            }
          })
      },
      onCloseErrorTable: function () {
        that.byId("errorTableDialog").close();
      },
      bindModel: function (array, OTable) {
        let count = 1;
        const oModel = that.getOwnerComponent().getModel();
        if (OTable.getColumns()[0]) {
          OTable.removeAllColumns();
          OTable.removeAllCustomData();
        }
        var noOfColumn = Object.keys(array[0]).length;
        for (let i = 0; i < noOfColumn; i++) {
          var oColumn = new sap.m.Column(
            Object.keys(array[0])[i] + "" + Math.floor((Math.random() * 1000)),
            {
              header: new sap.m.Label({
                text: Object.keys(array[0])[i],
              }),
            }
          );
          OTable.addColumn(oColumn);
        }
        var oCell = [];
        for (let i = 0; i < noOfColumn; i++) {
          let char = "{" + Object.keys(array[0])[i] + "}";
          var cell1;
          cell1 = new sap.m.Text({
            text: char
          });
          oCell.push(cell1);
        }
        var aColList = new sap.m.ColumnListItem(
          Object.keys(array[0])[1] + "ID" + Math.floor((Math.random() * 1000)),
          {
            cells: oCell
          }
        );
        OTable.bindItems("/items", aColList);
      },
      onChangeType: function () {
        let key = that.byId("typeSelect").getSelectedKey();
        if (key === "VALID")
          that.byId("reasonSelect").setModel(new sap.ui.model.json.JSONModel({ reason: [] }));
        else
          that.byId("reasonSelect").setModel(new sap.ui.model.json.JSONModel({ reason: [{ reason: "ALL" }, { reason: "NULL" }, { reason: "NULL_PRODUCT" }, { reason: "NULL_ID" }, { reason: "String TYPE" }, { reason: "INVALID_ID" }, { reason: "ALREADY_EXIST" }] }));
        const items = that.byId("table2").getBinding("items");
        let filter;
        if (key === "ALL")
          filter = new sap.ui.model.Filter("TYPE", sap.ui.model.FilterOperator.Contains, "");
        else
          filter = new sap.ui.model.Filter("TYPE", sap.ui.model.FilterOperator.EQ, key);
        items.filter(filter);
      },
      onChangeReason: function () {
        let key1 = that.byId("typeSelect").getSelectedKey();
        let key2 = that.byId("reasonSelect").getSelectedKey();
        if (key1 === "ALL") key1 = "";
        const items = that.byId("table2").getBinding("items");
        let filter;
        if (key2 === "ALL")
          filter = new sap.ui.model.Filter([new sap.ui.model.Filter("REASON", sap.ui.model.FilterOperator.Contains, ""),
          new sap.ui.model.Filter("TYPE", sap.ui.model.FilterOperator.Contains, key1)],
            true
          );
        else
          filter = new sap.ui.model.Filter("REASON", sap.ui.model.FilterOperator.EQ, key2);
        items.filter(filter);
      }
    });
  }
);
