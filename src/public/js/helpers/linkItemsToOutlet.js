var _ = require('Underscore');
var categoryTemplate = require('../../templates/itemsPrices/itemsToOutlet/categoryRowTemplate.html');
var variantTemplate = require('../../templates/itemsPrices/itemsToOutlet/variantRowTemplate.html');

module.exports = function () {
    var curCollection;

    var templateCategory = _.template(categoryTemplate);
    var templateVariant = _.template(variantTemplate);

    var categoryRowTemplate = function (name, id, listType) {
        return templateCategory({
            category: {name: name, _id: id},
            listType: listType
        });
    };

    var variantRowTemplate = function (name, id, categoryName, categoryId, listType) {
        return templateVariant({
            variant : {name: name, _id: id, categoryName: categoryName, categoryId: categoryId},
            listType: listType
        });
    };

    var types = {
        variant : 'variant',
        category: 'category',
        item    : 'item'
    };

    var migrateItemRow = function ($row, $fromTable, $toTable) {
        var itemId = $row.attr('data-id');
        var fromTableCategoryItems;
        var categoryId = $row.attr('data-categoryId');
        var listType = $toTable.attr('data-listType');
        var categoryName = $row.attr('data-categoryName');
        var variantId = $row.attr('data-variantId');
        var variantName = $row.attr('data-variantName');
        var newRow = $row.remove().clone();
        var categoryRow = $toTable.find('#categoryRow' + categoryId);
        var variantRow;
        var html;
        var fromTableVariantItems = $fromTable.find('[data-variantId="' + variantId + '"]');

        if (fromTableVariantItems.length === 1) {
            fromTableVariantItems.remove();
            fromTableCategoryItems = $fromTable.find('[data-categoryId="' + categoryId + '"]');
            if (fromTableCategoryItems.length === 1) {
                fromTableCategoryItems.remove();
            }
        }

        newRow
            .find('.icon')
            .toggleClass('arrowRight')
            .toggleClass('cross');

        if (categoryRow.length) {
            variantRow = $toTable.find('#variantRow' + variantId);
            if (!variantRow.length) {
                categoryRow.after(newRow);
                html = variantRowTemplate(variantName, variantId, categoryName, categoryId, listType);
                categoryRow.after(html);
            } else {
                variantRow.after(newRow);
            }
        } else {
            $toTable.prepend(newRow);
            html = categoryRowTemplate(categoryName, categoryId, listType) + variantRowTemplate(variantName, variantId, categoryName, categoryId, listType);
            $toTable.prepend(html);
        }

        curCollection.changeExists(itemId);
    };

    var migrateVariantRow = function ($row, $fromTable, $toTable) {
        var $categoryRow;
        var categoryName;
        var categoryId = $row.attr('data-categoryId');
        var listType;
        var fromTableCategoryItems;
        var content;
        var variantId = $row.attr('data-variantId');
        var $variantRow = $toTable.find('#variantRow' + variantId);
        var $itemsRows;
        var itemsIds;

        if ($variantRow.length) {
            $row.remove();
        }

        content = $fromTable.find('[data-variantId="' + variantId + '"]');
        $itemsRows = $fromTable.find('[data-variantId="' + variantId + '"][data-type="item"]');
        itemsIds = $itemsRows.attr('data-id');
        content.remove().clone();
        fromTableCategoryItems = $fromTable.find('[data-categoryId="' + categoryId + '"]');
        content
            .find('.icon')
            .toggleClass('arrowRight')
            .toggleClass('cross');



        if (fromTableCategoryItems.length === 1) {
            fromTableCategoryItems.remove();
        }

        if ($variantRow.length) {
            return $variantRow.after(content);
        }

        $categoryRow = $toTable.find('#categoryRow' + categoryId);

        if ($categoryRow.length) {
            $categoryRow.after(content);
        } else {
            $toTable.prepend(content);

            listType = $toTable.attr('data-listType');
            categoryName = $row.attr('data-categoryName');

            $toTable.prepend(categoryRowTemplate(categoryName, categoryId, listType));
        }

        curCollection.changeExists(itemsIds);
    };

    var migrateCategoryRow = function ($row, $fromTable, $toTable) {
        var selector = '[data-type="variant"][data-categoryId="' + $row.attr('data-categoryId') + '"]';

        $fromTable.find(selector).each(function () {
            migrateVariantRow($(this), $fromTable, $toTable);
        });
    };

    var migrateRow = function ($row, tables, collection) {
        var type = $row.attr('data-type');
        var $fromTable = tables.from;
        var $toTable = tables.to;

        curCollection = collection;

        switch (type) {
            case types.variant:
                migrateVariantRow($row, $fromTable, $toTable);
                break;
            case types.category:
                migrateCategoryRow($row, $fromTable, $toTable);
                break;
            case types.item:
                migrateItemRow($row, $fromTable, $toTable);
                break;
        }
    };

    return {migrateRow: migrateRow};
};
