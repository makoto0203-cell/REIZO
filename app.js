
    const FOOD_STORAGE_KEY = "reizo_foods_v1";
    const SEASONING_STORAGE_KEY = "reizo_seasonings_v1";
    const FOOD_PREFERENCES_STORAGE_KEY = "reizo_food_preferences_v1";
    const FOOD_LEARNING_ENABLED_KEY = "reizo_food_learning_enabled_v1";
    const DRINK_VARIANT_PREFERENCES_STORAGE_KEY = "reizo_drink_variant_preferences_v1";
    const FREEZER_SORT_STORAGE_KEY = "reizo_freezer_sort_v1";
    const FREEZER_ORDER_STORAGE_KEY = "reizo_freezer_order_v1";

    let foods = readStorage(FOOD_STORAGE_KEY);
    let seasonings = readStorage(SEASONING_STORAGE_KEY);
    let selectedStockCategory = "すべて";
    let toastTimer = null;
    let foodCategoryManuallyChanged = false;
    let foodTypeManuallyChanged = false;
    let foodUnitManuallyChanged = false;
    let foodLocationManuallyChanged = false;
    let foodPreferences = readObjectStorage(FOOD_PREFERENCES_STORAGE_KEY);
    let foodLearningEnabled = localStorage.getItem(FOOD_LEARNING_ENABLED_KEY) !== "false";
    let drinkVariantPreferences = readObjectStorage(DRINK_VARIANT_PREFERENCES_STORAGE_KEY);
    let freezerSort = localStorage.getItem(FREEZER_SORT_STORAGE_KEY) || "expiry";
    let freezerOrder = readObjectStorage(FREEZER_ORDER_STORAGE_KEY);
    let freezeSplitFoodId = null;
    let freezeWheelDigits = [0, 0, 0];
    let freezeSwipeStartX = 0;
    let freezeSwipeStartY = 0;
    let freezeUndoAction = null;

    function readStorage(key) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        return Array.isArray(data) ? data : [];
      } catch (error) {
        return [];
      }
    }

    function readObjectStorage(key) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        return data && typeof data === "object" && !Array.isArray(data) ? data : {};
      } catch (error) {
        return {};
      }
    }

    function writeStorage(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    }

    function saveFoods() {
      writeStorage(FOOD_STORAGE_KEY, foods);
    }

    function saveSeasonings() {
      writeStorage(SEASONING_STORAGE_KEY, seasonings);
    }

    function showScreen(screenId) {
      document.querySelectorAll(".screen").forEach(function(screen) {
        screen.classList.remove("active");
      });

      const target = document.getElementById(screenId);

      if (!target) {
        return;
      }

      target.classList.add("active");

      if (screenId === "homeScreen") {
        renderHome();
      }

      if (screenId === "stockScreen") {
        renderStockCategoryTabs();
        renderStock();
      }

      if (screenId === "categoryScreen") {
        renderCategories();
      }

      if (screenId === "seasoningScreen") {
        renderSeasonings();
      }

      if (screenId === "shoppingScreen") {
        renderShoppingList();
      }

      if (screenId === "freezerScreen") {
        syncFreezerSortControl();
        renderFreezer();
      }

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }

    function renderHome() {
      document.getElementById("totalCount").textContent = foods.length;
      document.getElementById("seasoningCount").textContent =
        seasonings.length;
const shoppingFoodCount = foods.filter(function(food) {
        return Boolean(food.shopping || food.buyNext);
      }).length;

      const shoppingSeasoningCount = seasonings.filter(function(item) {
        return Boolean(item.buyNext);
      }).length;

      document.getElementById("shoppingCount").textContent =
        shoppingFoodCount + shoppingSeasoningCount + "件";
      const urgentFoods = sortFoodsByExpiry(foods).filter(function(food) {
        return getDaysLeft(food.expiry) <= 3;
      });

      document.getElementById("urgentCount").textContent =
        urgentFoods.length;

      const urgentList = document.getElementById("urgentList");

      if (foods.length === 0) {
        urgentList.innerHTML =
          '<div class="home-empty">まだ食材が登録されていません。<br>「食材を追加」から登録できます。</div>';
        return;
      }

      const displayFoods = sortFoodsByExpiry(foods).filter(function(food) {
        return getDaysLeft(food.expiry) <= 7;
      });

      if (displayFoods.length === 0) {
        urgentList.innerHTML =
          '<div class="home-empty">7日以内に期限が来る食材はありません。</div>';
        return;
      }

      urgentList.innerHTML =
        '<div class="home-urgent-list">' +
        displayFoods
          .slice(0, 5)
          .map(function(food) {
            return createHomeUrgentHtml(food);
          })
          .join("") +
        "</div>";
    }

    function openAddFood() {
      resetFoodForm();
      
  
  

    document.getElementById("foodPurchaseDate").value =
        getTodayString();

      document.getElementById("foodPurchaseDate").value =
        getTodayString();

      document.getElementById("foodFormTitle").textContent =
        "食材を追加";

      document.getElementById("foodSaveButton").textContent =
        "登録する";

      syncFoodLearningToggle();
      renderFoodInputSuggestions();
      showScreen("addScreen");
    }

    function editFood(id) {
      const food = foods.find(function(item) {
        return item.id === id;
      });

      if (!food) {
        return;
      }

      document.getElementById("editingFoodId").value = food.id;
      document.getElementById("foodName").value = food.name || "";
      document.getElementById("foodCategory").value =
        food.category || "その他";
      setDefaultUnitByCategory(true);
      document.getElementById("foodType").value = food.type || "";

      document.getElementById("foodLocation").value =
        food.location || "冷蔵";

      document.getElementById("foodAmount").value =
        food.amount ?? "";

      document.getElementById("foodUnit").value =
        food.unit ?? "";

      document.getElementById("foodExpiry").value =
        food.expiry || "";

      document.getElementById("foodPurchaseDate").value =
        food.purchaseDate || "";

      document.getElementById("foodNote").value =
        food.note || "";

      document.getElementById("foodCapacity").value = food.capacity || "";
      document.getElementById("drinkVariantLearningKey").value = food.drinkVariantLearningKey || "";
      renderDrinkVariantSuggestions();

      document.getElementById("foodFormTitle").textContent =
        "食材を編集";

      document.getElementById("foodSaveButton").textContent =
        "変更を保存";
      foodCategoryManuallyChanged = false;
      foodTypeManuallyChanged = false;
      foodUnitManuallyChanged = false;
      foodLocationManuallyChanged = false;
      updateAutoDetectNote("");

      showScreen("addScreen");
    }

    function saveFoodFromForm() {
      const editingId =
        document.getElementById("editingFoodId").value;

      const name =
        document.getElementById("foodName").value.trim();

      const category =
        document.getElementById("foodCategory").value;

      const type =
        document.getElementById("foodType").value;

      const location =
        document.getElementById("foodLocation").value;

      const amount =
        document.getElementById("foodAmount").value;

      const unit =
        document.getElementById("foodUnit").value;

      const capacity =
        document.getElementById("foodCapacity").value;

      const drinkVariantLearningKey =
        document.getElementById("drinkVariantLearningKey").value;

      const expiry =
        document.getElementById("foodExpiry").value;

      const purchaseDate =
        document.getElementById("foodPurchaseDate").value;

      const note =
        document.getElementById("foodNote").value.trim();

      if (!name) {
        alert("食材名を入力してください。");
        document.getElementById("foodName").focus();
        return;
      }

      const existingFood = editingId
        ? foods.find(function(food) { return String(food.id) === String(editingId); })
        : null;
      const isSelfFrozenSave =
        location === "冷凍" &&
        ((existingFood && existingFood.freezerKind === "self") || category !== "冷凍食品");

      if (!expiry && !isSelfFrozenSave) {
        alert("賞味期限・消費期限を入力してください。");
        document.getElementById("foodExpiry").focus();
        return;
      }

      if (editingId) {
        const foodIndex = foods.findIndex(function(food) {
          return String(food.id) === String(editingId);
        });

        if (foodIndex !== -1) {
          foods[foodIndex] = {
            ...foods[foodIndex],
            name: name,
            category: category,
            type: type,
            location: location,
            amount: amount,
            unit: unit,
            capacity: capacity,
            drinkVariantLearningKey: drinkVariantLearningKey,
            expiry: isSelfFrozenSave ? "" : expiry,
            purchaseDate: purchaseDate,
            note: note,
            freezerKind: location === "冷凍" ? (isSelfFrozenSave ? "self" : "commercial") : undefined,
            frozenAt: isSelfFrozenSave ? (foods[foodIndex].frozenAt || getTodayString()) : "",
            updatedAt: new Date().toISOString()
          };
        }

        showToast("食材を変更しました");
      } else {
        foods.push({
          id: Date.now(),
          name: name,
          category: category,
          type: type,
          location: location,
          amount: amount,
          unit: unit,
          capacity: capacity,
          drinkVariantLearningKey: drinkVariantLearningKey,
          expiry: isSelfFrozenSave ? "" : expiry,
          purchaseDate: purchaseDate,
          note: note,
          freezerKind: location === "冷凍" ? (isSelfFrozenSave ? "self" : "commercial") : undefined,
          frozenAt: isSelfFrozenSave ? getTodayString() : "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        showToast("食材を登録しました");
      }

      learnFoodPreferences(name, amount, unit, expiry, purchaseDate, location);
      learnDrinkVariant(drinkVariantLearningKey, name, capacity);
      saveFoods();
      resetFoodForm();
      showScreen("homeScreen");
    }

    function cancelFoodForm() {
      resetFoodForm();
      showScreen("homeScreen");
    }

    function resetFoodForm() {
      document.getElementById("editingFoodId").value = "";
      document.getElementById("foodName").value = "";
      document.getElementById("foodCategory").value = "肉";
      setDefaultUnitByCategory(true);
      document.getElementById("foodType").value = "";
      document.getElementById("foodLocation").value = "冷蔵";
      document.getElementById("foodAmount").value = "";
      document.getElementById("foodUnit").value = "g";
      document.getElementById("foodExpiry").value = "";
      document.getElementById("foodPurchaseDate").value = "";
      document.getElementById("foodNote").value = "";
      document.getElementById("foodCapacity").value = "";
      document.getElementById("drinkVariantLearningKey").value = "";
      foodCategoryManuallyChanged = false;
      foodTypeManuallyChanged = false;
      foodUnitManuallyChanged = false;
      foodLocationManuallyChanged = false;
      updateAutoDetectNote("");
    }

    function deleteFood(id) {
      const food = foods.find(function(item) {
        return item.id === id;
      });

      if (!food) {
        return;
      }

      const confirmed = confirm(
        "「" + food.name + "」を削除しますか？"
      );

      if (!confirmed) {
        return;
      }

      foods = foods.filter(function(item) {
        return item.id !== id;
      });

      saveFoods();
      renderHome();
      renderStock();
      renderCategories();
      showToast("食材を削除しました");
    }
function toggleShoppingItem(id) {
    const food = foods.find(function(item) {
        return item.id === id;
    });

    if (!food) {
        return;
    }

    const nextState = !Boolean(food.shopping || food.buyNext);
    food.shopping = nextState;
    food.buyNext = nextState;

    saveFoods();
    renderHome();
    renderStock();
    renderCategories();
    renderShoppingList();

    showToast(
        nextState
            ? "買い物リストに追加しました"
            : "買い物リストから外しました"
    );
}
    function renderStockCategoryTabs() {
      const container =
        document.getElementById("stockCategoryTabs");

      const categories = [
        "すべて",
        ...new Set(
          foods.map(function(food) {
            return food.category || "その他";
          })
        )
      ];

      if (!categories.includes(selectedStockCategory)) {
        selectedStockCategory = "すべて";
      }

      container.innerHTML = categories
        .map(function(category) {
          const activeClass =
            category === selectedStockCategory ? " active" : "";

          return (
            '<button class="chip' +
            activeClass +
            '" type="button" onclick="setStockCategory(\'' +
            escapeForAttribute(category) +
            "')\">" +
            escapeHtml(getCategoryDisplayName(category)) +
            "</button>"
          );
        })
        .join("");
    }

    function setStockCategory(category) {
      selectedStockCategory = category;
      renderStockCategoryTabs();
      renderStock();
    }

    function renderStock() {
      const stockList = document.getElementById("stockList");
      const searchInput = document.getElementById("stockSearch");
      const sortSelect = document.getElementById("stockSort");

      const searchText = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

      const sortType = sortSelect
        ? sortSelect.value
        : "expiry";

      let filteredFoods = foods.filter(function(food) {
        const categoryMatches =
          selectedStockCategory === "すべて" ||
          food.category === selectedStockCategory;

        const nameMatches =
          !searchText ||
          String(food.name).toLowerCase().includes(searchText);

        return categoryMatches && nameMatches;
      });

      if (sortType === "expiry") {
        filteredFoods = sortFoodsByExpiry(filteredFoods);
      }

      if (sortType === "newest") {
        filteredFoods.sort(function(a, b) {
          return Number(b.id) - Number(a.id);
        });
      }

      if (sortType === "name") {
        filteredFoods.sort(function(a, b) {
          return String(a.name).localeCompare(
            String(b.name),
            "ja"
          );
        });
      }

      if (filteredFoods.length === 0) {
        stockList.innerHTML = createEmptyHtml(
          foods.length === 0
            ? "まだ食材が登録されていません。"
            : "条件に一致する食材がありません。"
        );

        return;
      }

      stockList.innerHTML = filteredFoods
        .map(function(food) {
          if (food.location === "冷凍") {
            return createFoodHtml(food, true);
          }
          return createFreezeSwipeFoodHtml(food);
        })
        .join("");
    }

    function renderCategories() {
      const categoryList =
        document.getElementById("categoryList");

      if (foods.length === 0) {
        categoryList.innerHTML = createEmptyHtml(
          "食材を登録すると、カテゴリー別に表示されます。"
        );
        return;
      }

      const categoryMap = {};

      sortFoodsByExpiry(foods).forEach(function(food) {
        const category = food.category || "その他";

        if (!categoryMap[category]) {
          categoryMap[category] = [];
        }

        categoryMap[category].push(food);
      });

      categoryList.innerHTML = Object.keys(categoryMap)
        .sort(function(a, b) {
          return a.localeCompare(b, "ja");
        })
        .map(function(category) {
          const categoryFoods = categoryMap[category];

          return (
            '<section class="category-block">' +
            '<div class="category-heading">' +
            "<h3>" +
            escapeHtml(getCategoryDisplayName(category)) +
            "</h3>" +
            '<span class="category-count">' +
            categoryFoods.length +
            "件</span>" +
            "</div>" +
            categoryFoods
              .map(function(food) {
                return createFoodHtml(food, true);
              })
              .join("") +
            "</section>"
          );
        })
        .join("");
    }

    function createHomeUrgentHtml(food) {
      const daysLeft = getDaysLeft(food.expiry);
      const status = getFoodStatus(daysLeft);
      const amountText = createAmountText(food);
      const hasAmount = amountText !== "未入力";
      const metaParts = [
        getCategoryDisplayName(food.category || "その他")
      ];

      if (food.location) {
        metaParts.push(food.location);
      }

      return (
        '<button class="home-urgent-row" type="button" onclick="editFood(' +
        food.id +
        ')">' +
        '<span class="home-urgent-main">' +
        '<span class="home-urgent-topline">' +
        '<span class="home-urgent-name">' +
        escapeHtml(food.name) +
        "</span>" +
        (hasAmount
          ? '<span class="home-urgent-amount">' + escapeHtml(amountText) + "</span>"
          : "") +
        "</span>" +
        '<span class="home-urgent-meta">' +
        escapeHtml(metaParts.join("・")) +
        "</span>" +
        "</span>" +
        '<span class="home-status-badge ' +
        status.className +
        '">' +
        escapeHtml(status.text) +
        "</span>" +
        '<span class="home-urgent-chevron" aria-hidden="true">›</span>' +
        "</button>"
      );
    }

    function createFoodHtml(food, showActions, showCartOnly) {
      const daysLeft = getDaysLeft(food.expiry);
      const status = getFoodStatus(daysLeft);
      const amountText = createAmountText(food);
      const purchaseText = food.purchaseDate
        ? "購入日：" + escapeHtml(food.purchaseDate)
        : "";

      const noteHtml = food.note
        ? '<div class="food-note">メモ：' +
          escapeHtml(food.note) +
          "</div>"
        : "";

      const actionHtml = showActions
  ? '<div class="item-actions">' +
    '<button class="small-button" type="button" onclick="editFood(' +
    food.id +
    ')">編集</button>' +
    '<button class="small-button" type="button" onclick="toggleShoppingItem(' +
food.id +
')">' + (Boolean(food.shopping || food.buyNext) ? '✅🛒' : '🛒') + '</button>' +
    '<button class="small-button delete" type="button" onclick="deleteFood(' +
    food.id +
    ')">削除</button>' +
    "</div>"
  : showCartOnly
  ? '<div class="item-actions">' +
    '<button class="small-button" type="button" onclick="toggleShoppingItem(' +
    food.id +
    ')">' + (Boolean(food.shopping || food.buyNext) ? '✅🛒' : '🛒') + '</button>' +
    "</div>"
  : "";

      return (
        '<article class="food-item ' +
        status.className +
        '">' +
        '<div class="food-heading">' +
        '<h3 class="food-name">' +
        escapeHtml(food.name) +
        "</h3>" +
        '<span class="status-badge ' +
        status.className +
        '">' +
        escapeHtml(status.text) +
        "</span>" +
        "</div>" +
        '<div class="food-info">' +
        escapeHtml(getCategoryDisplayName(food.category || "その他")) +
        (food.type ? " ／ " + escapeHtml(getTypeDisplayName(food.type)) : "") +
        " ／ " +
        escapeHtml(food.location || "保存場所未設定") +
        "<br>" +
        "数量：" +
        escapeHtml(amountText) +
        (food.capacity ? "<br>容量：" + escapeHtml(food.capacity) : "") +
        "<br>" +
        "期限：" +
        escapeHtml(food.expiry) +
        (purchaseText ? "<br>" + purchaseText : "") +
        "</div>" +
        noteHtml +
        actionHtml +
        "</article>"
      );
    }

    function createAmountText(food) {
      const hasAmount =
        food.amount !== undefined &&
        food.amount !== null &&
        String(food.amount).trim() !== "";

      if (!hasAmount) {
        return "未入力";
      }

      return String(food.amount) + String(food.unit || "");
    }

    function sortFoodsByExpiry(list) {
      return list.slice().sort(function(a, b) {
        const dateA = new Date(a.expiry + "T00:00:00");
        const dateB = new Date(b.expiry + "T00:00:00");

        return dateA - dateB;
      });
    }

    function getDaysLeft(expiry) {
      if (!expiry) {
        return 999999;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const expiryDate = new Date(expiry + "T00:00:00");

      return Math.ceil(
        (expiryDate - today) / 86400000
      );
    }

    function getFoodStatus(daysLeft) {

    // 期限切れ
    if (daysLeft < 0) {
        return {
            className: "expired",
            text: Math.abs(daysLeft) + "日経過"
        };
    }

    // 今日まで
    if (daysLeft === 0) {
        return {
            className: "today",
            text: "今日まで"
        };
    }

    // あと1日
    if (daysLeft === 1) {
        return {
            className: "today",
            text: "あと1日"
        };
    }

    // あと2〜6日
    if (daysLeft <= 6) {
        return {
            className: "soon",
            text: "あと" + daysLeft + "日"
        };
    }

    // あと7〜19日
    if (daysLeft <= 19) {
        return {
            className: "week",
            text: "あと" + daysLeft + "日"
        };
    }

    // あと20日以上
    return {
        className: "safe",
        text: "あと" + daysLeft + "日"
    };
}

    function openAddSeasoning() {
      resetSeasoningForm();

      document.getElementById("seasoningFormTitle").textContent =
        "調味料を追加";

      document.getElementById("seasoningSaveButton").textContent =
        "登録する";

      showScreen("seasoningFormScreen");
    }

    function editSeasoning(id) {
      const seasoning = seasonings.find(function(item) {
        return item.id === id;
      });

      if (!seasoning) {
        return;
      }

      document.getElementById("editingSeasoningId").value =
        seasoning.id;

      document.getElementById("seasoningName").value =
        seasoning.name || "";

      document.getElementById("seasoningAmount").value =
        seasoning.amount || "";

      document.getElementById("seasoningLocation").value =
        seasoning.location || "常温";

      document.getElementById("seasoningExpiry").value =
        seasoning.expiry || "";

      document.getElementById("seasoningNote").value =
        seasoning.note || "";

      document.getElementById("seasoningFormTitle").textContent =
        "調味料を編集";

      document.getElementById("seasoningSaveButton").textContent =
        "変更を保存";

      showScreen("seasoningFormScreen");
    }
const seasoningDatabase = {
  // 基本調味料
  "しょうゆ": "基本調味料",
  "醤油": "基本調味料",
  "塩": "基本調味料",
  "砂糖": "基本調味料",
  "こしょう": "基本調味料",
  "胡椒": "基本調味料",
  "ブラックペッパー": "基本調味料",
  "白こしょう": "基本調味料",

  // ソース
  "ケチャップ": "ソース",
  "マヨネーズ": "ソース",
  "中濃ソース": "ソース",
  "ウスターソース": "ソース",
  "とんかつソース": "ソース",
  "オイスターソース": "ソース",
  "焼肉のたれ": "ソース",
  "ポン酢": "ソース",

  // 油
  "サラダ油": "油",
  "オリーブオイル": "油",
  "ごま油": "油",
  "米油": "油",

  // だし
  "コンソメ": "だし",
  "鶏ガラスープ": "だし",
  "和風だし": "だし",
  "白だし": "だし",
  "めんつゆ": "だし",

  // 香辛料
  "七味": "香辛料",
  "一味": "香辛料",
  "カレー粉": "香辛料",
  "にんにく": "香辛料",
  "しょうが": "香辛料",

  // ドレッシング
  "シーザードレッシング": "ドレッシング",
  "ごまドレッシング": "ドレッシング",
  "和風ドレッシング": "ドレッシング",
  "青じそドレッシング": "ドレッシング"
};
function autoSelectSeasoningType() {
  
  const seasoningName = document
    .getElementById("seasoningName")
    .value
    .replace(/\s+/g, "")
    .toLowerCase();

  const seasoningType =
    document.getElementById("seasoningType");

  if (!seasoningName) {
    seasoningType.value = "";
    return;
  }

  const matchedSeasoning = Object.keys(seasoningDatabase)
    .sort(function(a, b) {
      return b.length - a.length;
    })
    .find(function(name) {
      return seasoningName.includes(name.toLowerCase());
    });

  seasoningType.value = matchedSeasoning
    ? seasoningDatabase[matchedSeasoning]
    : "";
}
    function saveSeasoningFromForm() {
      const editingId =
        document.getElementById("editingSeasoningId").value;

      const name =
        document.getElementById("seasoningName").value.trim();

      const amount =
        document.getElementById("seasoningAmount").value.trim();

      const location =
        document.getElementById("seasoningLocation").value;

      const expiry =
        document.getElementById("seasoningExpiry").value;

      const note =
        document.getElementById("seasoningNote").value.trim();

      if (!name) {
        alert("調味料名を入力してください。");
        document.getElementById("seasoningName").focus();
        return;
      }

      if (editingId) {
        const index = seasonings.findIndex(function(item) {
          return String(item.id) === String(editingId);
        });

        if (index !== -1) {
          seasonings[index] = {
            ...seasonings[index],
            name: name,
            amount: amount,
            location: location,
            expiry: expiry,
            note: note,
            updatedAt: new Date().toISOString()
          };
        }

        showToast("調味料を変更しました");
      } else {
        seasonings.push({
          id: Date.now(),
          name: name,
          amount: amount,
          location: location,
          expiry: expiry,
          note: note,
          buyNext: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        showToast("調味料を登録しました");
      }

      saveSeasonings();
      resetSeasoningForm();
      showScreen("seasoningScreen");
    }

    function resetSeasoningForm() {
      document.getElementById("editingSeasoningId").value = "";
      document.getElementById("seasoningName").value = "";
      document.getElementById("seasoningAmount").value = "";
      document.getElementById("seasoningLocation").value = "常温";
      document.getElementById("seasoningExpiry").value = "";
      document.getElementById("seasoningNote").value = "";
    }

    function deleteSeasoning(id) {
      const seasoning = seasonings.find(function(item) {
        return item.id === id;
      });

      if (!seasoning) {
        return;
      }

      const confirmed = confirm(
        "「" + seasoning.name + "」を削除しますか？"
      );

      if (!confirmed) {
        return;
      }

      seasonings = seasonings.filter(function(item) {
        return item.id !== id;
      });

      saveSeasonings();
      renderSeasonings();
      renderHome();
      showToast("調味料を削除しました");
    }
function toggleBuyNext(id) {
  const seasoning = seasonings.find(function(item) {
    return item.id === id;
  });

  if (!seasoning) {
    return;
  }

  seasoning.buyNext = !seasoning.buyNext;

  saveSeasonings();
  renderSeasonings();
  renderHome();
  renderShoppingList();

  showToast(
    seasoning.buyNext
      ? "買い物リストに追加しました"
      : "買い物リストから外しました"
  );
}
    function renderSeasonings() {
      const seasoningList =
        document.getElementById("seasoningList");

      if (seasonings.length === 0) {
        seasoningList.innerHTML = createEmptyHtml(
          "まだ調味料が登録されていません。"
        );
        return;
      }

      const sorted = seasonings.slice().sort(function(a, b) {
        if (!a.expiry && !b.expiry) {
          return String(a.name).localeCompare(
            String(b.name),
            "ja"
          );
        }

        if (!a.expiry) {
          return 1;
        }

        if (!b.expiry) {
          return -1;
        }

        return (
          new Date(a.expiry + "T00:00:00") -
          new Date(b.expiry + "T00:00:00")
        );
      });

      seasoningList.innerHTML = sorted
        .map(function(seasoning) {
          let status = {
            className: "safe",
            text: "期限未入力"
          };

          if (seasoning.expiry) {
            status = getFoodStatus(
              getDaysLeft(seasoning.expiry)
            );
          }

          const expiryText = seasoning.expiry
            ? seasoning.expiry
            : "未入力";

          const amountText = seasoning.amount || "未入力";

          const noteHtml = seasoning.note
            ? '<div class="food-note">メモ：' +
              escapeHtml(seasoning.note) +
              "</div>"
            : "";

          return (
            '<article class="food-item ' +
            status.className +
            '">' +
            '<div class="food-heading">' +
            '<h3 class="food-name">' +
            escapeHtml(seasoning.name) +
            "</h3>" +
            '<span class="status-badge ' +
            status.className +
            '">' +
            escapeHtml(status.text) +
            "</span>" +
            "</div>" +
            '<div class="food-info">' +
            "保存：" +
            escapeHtml(seasoning.location || "未設定") +
            "<br>" +
            "残量・数量：" +
            escapeHtml(amountText) +
            "<br>" +
            "期限：" +
            escapeHtml(expiryText) +
            "</div>" +
            noteHtml +
            '<div class="item-actions">' +
            '<button class="small-button" type="button" onclick="editSeasoning(' +
            seasoning.id +
            ')">編集</button>' +
            '<button class="small-button" type="button" onclick="toggleBuyNext(' + seasoning.id + ')">' + (seasoning.buyNext ? "✅🛒" : "🛒") + '</button>' +
            
            '<button class="small-button delete" type="button" onclick="deleteSeasoning(' +
            seasoning.id +
            ')">削除</button>' +
            "</div>" +
            "</article>"
          );
        })
        .join("");
    }

    function createEmptyHtml(message) {
      return '<div class="empty">' + message + "</div>";
    }

    function getTodayString() {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return year + "-" + month + "-" + day;
    }
const vegetableDatabase = {
  // 葉物
  "キャベツ": "葉物",
  "レタス": "葉物",
  "サニーレタス": "葉物",
  "サラダ菜": "葉物",
  "白菜": "葉物",
  "ほうれん草": "葉物",
  "ほうれんそう": "葉物",
  "小松菜": "葉物",
  "水菜": "葉物",
  "春菊": "葉物",
  "チンゲンサイ": "葉物",
  "青梗菜": "葉物",
  "ニラ": "葉物",
  "モロヘイヤ": "葉物",
  "ルッコラ": "葉物",

  // 根菜・いも類
  "にんじん": "根菜",
  "人参": "根菜",
  "大根": "根菜",
  "かぶ": "根菜",
  "カブ": "根菜",
  "ごぼう": "根菜",
  "ゴボウ": "根菜",
  "れんこん": "根菜",
  "レンコン": "根菜",
  "じゃがいも": "根菜",
  "ジャガイモ": "根菜",
  "じゃが芋": "根菜",
  "さつまいも": "根菜",
  "サツマイモ": "根菜",
  "里芋": "根菜",
  "さといも": "根菜",
  "長芋": "根菜",
  "山芋": "根菜",
  "玉ねぎ": "根菜",
  "玉葱": "根菜",
  "にんにく": "根菜",
  "ニンニク": "根菜",
  "しょうが": "根菜",
  "生姜": "根菜",

  // 実野菜
  "ミニトマト": "実野菜",
  "トマト": "実野菜",
  "アボカド": "実野菜",
  "きゅうり": "実野菜",
  "キュウリ": "実野菜",
  "なす": "実野菜",
  "ナス": "実野菜",
  "ピーマン": "実野菜",
  "パプリカ": "実野菜",
  "ししとう": "実野菜",
  "オクラ": "実野菜",
  "かぼちゃ": "実野菜",
  "カボチャ": "実野菜",
  "ズッキーニ": "実野菜",
  "ゴーヤ": "実野菜",
  "とうもろこし": "実野菜",
  "トウモロコシ": "実野菜",

  // 花野菜
  "ブロッコリー": "花野菜",
  "カリフラワー": "花野菜",
  "菜の花": "花野菜",

  // 茎野菜
  "アスパラガス": "茎野菜",
  "アスパラ": "茎野菜",
  "セロリ": "茎野菜",
  "たけのこ": "茎野菜",
  "筍": "茎野菜",

  // 香味野菜
  "長ねぎ": "香味野菜",
  "長ネギ": "香味野菜",
  "青ねぎ": "香味野菜",
  "青ネギ": "香味野菜",
  "万能ねぎ": "香味野菜",
  "万能ネギ": "香味野菜",
  "ねぎ": "香味野菜",
  "ネギ": "香味野菜",
  "みょうが": "香味野菜",
  "ミョウガ": "香味野菜",
  "大葉": "香味野菜",
  "しそ": "香味野菜",
  "シソ": "香味野菜",
  "パセリ": "香味野菜",
  "パクチー": "香味野菜",

  // 豆類
  "枝豆": "豆類",
  "さやいんげん": "豆類",
  "いんげん": "豆類",
  "スナップえんどう": "豆類",
  "絹さや": "豆類",
  "そら豆": "豆類",
  "グリーンピース": "豆類",

  // きのこ
  "ぶなしめじ": "きのこ",
  "しめじ": "きのこ",
  "しいたけ": "きのこ",
  "椎茸": "きのこ",
  "えのきだけ": "きのこ",
  "えのき": "きのこ",
  "まいたけ": "きのこ",
  "舞茸": "きのこ",
  "エリンギ": "きのこ",
  "なめこ": "きのこ",
  "マッシュルーム": "きのこ",
  "きくらげ": "きのこ",

  // その他
  "もやし": "その他"
};
const meatDatabase = {
  // 鶏肉
  "鶏むね": "鶏肉",
  "鶏胸": "鶏肉",
  "むね肉": "鶏肉",
  "胸肉": "鶏肉",
  "鶏もも": "鶏肉",
  "もも肉": "鶏肉",
  "鶏ささみ": "鶏肉",
  "ささみ": "鶏肉",
  "鶏手羽元": "鶏肉",
  "手羽元": "鶏肉",
  "鶏手羽先": "鶏肉",
  "手羽先": "鶏肉",
  "鶏ひき肉": "鶏肉",
  "鶏ミンチ": "鶏肉",
  "鶏肉": "鶏肉",
"牛豚合い挽き": "牛豚合い挽き",
"牛豚合い挽き肉": "牛豚合い挽き",
"合い挽き": "牛豚合い挽き",
"合い挽き肉": "牛豚合い挽き",
"合いびき": "牛豚合い挽き",
"合いびき肉": "牛豚合い挽き",
"合挽き": "牛豚合い挽き",
"合挽き肉": "牛豚合い挽き",
  // 豚肉
  "豚バラ": "豚肉",
  "豚ばら": "豚肉",
  "豚ロース": "豚肉",
  "豚肩ロース": "豚肉",
  "豚こま": "豚肉",
  "豚小間": "豚肉",
  "豚切り落とし": "豚肉",
  "豚ひき肉": "豚肉",
  "豚ミンチ": "豚肉",
  "豚もも": "豚肉",
  "豚ヒレ": "豚肉",
  "スペアリブ": "豚肉",
  "豚肉": "豚肉",

  // 牛肉
  "牛バラ": "牛肉",
  "牛ばら": "牛肉",
  "牛ロース": "牛肉",
  "牛肩ロース": "牛肉",
  "牛こま": "牛肉",
  "牛小間": "牛肉",
  "牛切り落とし": "牛肉",
  "牛ひき肉": "牛肉",
  "牛ミンチ": "牛肉",
  "牛もも": "牛肉",
  "牛ヒレ": "牛肉",
  "牛タン": "牛肉",
  "牛すじ": "牛肉",
  "ステーキ肉": "牛肉",
  "牛肉": "牛肉",

  // ジビエ
  "鹿肉": "ジビエ",
  "猪肉": "ジビエ",
  "いのしし肉": "ジビエ",
  "鴨肉": "ジビエ",
  "ラム肉": "ジビエ",
  "羊肉": "ジビエ",
  "馬肉": "ジビエ"
};
const fishDatabase = {
  // 鮭
  "塩鮭": "鮭",
  "銀鮭": "鮭",
  "紅鮭": "鮭",
  "秋鮭": "鮭",
  "生鮭": "鮭",
  "サーモン": "鮭",
  "鮭": "鮭",
  "しゃけ": "鮭",

  // マグロ
  "ネギトロ": "マグロ",
  "まぐろたたき": "マグロ",
  "マグロたたき": "マグロ",
  "本マグロ": "マグロ",
  "びんちょうまぐろ": "マグロ",
  "ビンチョウマグロ": "マグロ",
  "キハダマグロ": "マグロ",
  "メバチマグロ": "マグロ",
  "まぐろ": "マグロ",
  "マグロ": "マグロ",

  // サバ
  "塩サバ": "サバ",
  "塩さば": "サバ",
  "しめ鯖": "サバ",
  "しめさば": "サバ",
  "サバ": "サバ",
  "さば": "サバ",
  "鯖": "サバ",

  // アジ
  "アジの開き": "アジ",
  "あじの開き": "アジ",
  "アジ": "アジ",
  "あじ": "アジ",
  "鯵": "アジ",

  // ブリ
  "ぶり切り身": "ブリ",
  "ブリ切り身": "ブリ",
  "ハマチ": "ブリ",
  "はまち": "ブリ",
  "ブリ": "ブリ",
  "ぶり": "ブリ",

  // カツオ
  "カツオのたたき": "カツオ",
  "かつおのたたき": "カツオ",
  "鰹のたたき": "カツオ",
  "カツオ": "カツオ",
  "かつお": "カツオ",
  "鰹": "カツオ",

  // タイ
  "真鯛": "タイ",
  "まだい": "タイ",
  "鯛": "タイ",
  "タイ": "タイ",

  // イワシ
  "いわし": "イワシ",
  "イワシ": "イワシ",
  "鰯": "イワシ",

  // サンマ
  "さんま": "サンマ",
  "サンマ": "サンマ",
  "秋刀魚": "サンマ",

  // タラ
  "銀だら": "タラ",
  "銀ダラ": "タラ",
  "真鱈": "タラ",
  "たら": "タラ",
  "タラ": "タラ",
  "鱈": "タラ",

  // カレイ
  "カレイ": "カレイ",
  "かれい": "カレイ",
  "鰈": "カレイ",

  // ヒラメ
  "ヒラメ": "ヒラメ",
  "ひらめ": "ヒラメ",
  "平目": "ヒラメ",

  // うなぎ
  "うなぎ蒲焼": "うなぎ",
  "うなぎの蒲焼": "うなぎ",
  "ウナギ": "うなぎ",
  "うなぎ": "うなぎ",
  "鰻": "うなぎ",

  // エビ
  "ブラックタイガー": "エビ",
  "むきえび": "エビ",
  "むきエビ": "エビ",
  "甘エビ": "エビ",
  "甘えび": "エビ",
  "車海老": "エビ",
  "エビ": "エビ",
  "えび": "エビ",
  "海老": "エビ",

  // カニ
  "カニカマ": "カニ",
  "かにかま": "カニ",
  "ズワイガニ": "カニ",
  "タラバガニ": "カニ",
  "カニ": "カニ",
  "かに": "カニ",
  "蟹": "カニ",

  // イカ
  "するめいか": "イカ",
  "スルメイカ": "イカ",
  "やりいか": "イカ",
  "ヤリイカ": "イカ",
  "いか": "イカ",
  "イカ": "イカ",
  "烏賊": "イカ",

  // タコ
  "ゆでだこ": "タコ",
  "茹でだこ": "タコ",
  "たこ": "タコ",
  "タコ": "タコ",
  "蛸": "タコ",

  // 貝類
  "ホタテ": "貝類",
  "ほたて": "貝類",
  "帆立": "貝類",
  "あさり": "貝類",
  "アサリ": "貝類",
  "しじみ": "貝類",
  "シジミ": "貝類",
  "牡蠣": "貝類",
  "かき": "貝類",
  "カキ": "貝類",
  "はまぐり": "貝類",
  "ハマグリ": "貝類",

  // 刺身
  "刺身盛り合わせ": "刺身",
  "お刺身盛り合わせ": "刺身",
  "刺身盛合せ": "刺身",
  "刺身セット": "刺身",
  "お刺身": "刺身",
  "刺身": "刺身",

  // その他
  "しらす": "その他",
  "ちりめんじゃこ": "その他",
  "明太子": "その他",
  "たらこ": "その他",
  "数の子": "その他",
  "ホッケ": "その他",
  "ほっけ": "その他"
};
const fruitDatabase = {
  "りんご": { type: "りんご", unit: "個", location: "野菜室" },
  "リンゴ": { type: "りんご", unit: "個", location: "野菜室" },
  "アップル": { type: "りんご", unit: "個", location: "野菜室" },
  "バナナ": { type: "バナナ", unit: "本", location: "常温" },
  "みかん": { type: "みかん", unit: "個", location: "野菜室" },
  "ミカン": { type: "みかん", unit: "個", location: "野菜室" },
  "オレンジ": { type: "オレンジ", unit: "個", location: "野菜室" },
  "甘夏": { type: "甘夏", unit: "個", location: "野菜室" },
  "はっさく": { type: "はっさく", unit: "個", location: "野菜室" },
  "八朔": { type: "はっさく", unit: "個", location: "野菜室" },
  "伊予柑": { type: "伊予柑", unit: "個", location: "野菜室" },
  "いよかん": { type: "伊予柑", unit: "個", location: "野菜室" },
  "デコポン": { type: "デコポン", unit: "個", location: "野菜室" },
  "ポンカン": { type: "ポンカン", unit: "個", location: "野菜室" },
  "グレープフルーツ": { type: "グレープフルーツ", unit: "個", location: "野菜室" },
  "レモン": { type: "レモン", unit: "個", location: "野菜室" },
  "ライム": { type: "ライム", unit: "個", location: "野菜室" },
  "ゆず": { type: "ゆず", unit: "個", location: "野菜室" },
  "柚子": { type: "ゆず", unit: "個", location: "野菜室" },
  "すだち": { type: "すだち", unit: "個", location: "野菜室" },
  "かぼす": { type: "かぼす", unit: "個", location: "野菜室" },
  "ぶどう": { type: "ぶどう", unit: "房", location: "野菜室" },
  "ブドウ": { type: "ぶどう", unit: "房", location: "野菜室" },
  "葡萄": { type: "ぶどう", unit: "房", location: "野菜室" },
  "いちご": { type: "いちご", unit: "パック", location: "野菜室" },
  "イチゴ": { type: "いちご", unit: "パック", location: "野菜室" },
  "苺": { type: "いちご", unit: "パック", location: "野菜室" },
  "キウイ": { type: "キウイ", unit: "個", location: "野菜室" },
  "桃": { type: "桃", unit: "個", location: "野菜室" },
  "もも": { type: "桃", unit: "個", location: "野菜室" },
  "梨": { type: "梨", unit: "個", location: "野菜室" },
  "なし": { type: "梨", unit: "個", location: "野菜室" },
  "洋梨": { type: "洋梨", unit: "個", location: "野菜室" },
  "ラフランス": { type: "洋梨", unit: "個", location: "野菜室" },
  "柿": { type: "柿", unit: "個", location: "野菜室" },
  "かき": { type: "柿", unit: "個", location: "野菜室" },
  "さくらんぼ": { type: "さくらんぼ", unit: "パック", location: "野菜室" },
  "サクランボ": { type: "さくらんぼ", unit: "パック", location: "野菜室" },
  "チェリー": { type: "さくらんぼ", unit: "パック", location: "野菜室" },
  "スイカ": { type: "スイカ", unit: "個", location: "野菜室" },
  "すいか": { type: "スイカ", unit: "個", location: "野菜室" },
  "メロン": { type: "メロン", unit: "個", location: "野菜室" },
  "パイナップル": { type: "パイナップル", unit: "個", location: "野菜室" },
  "パイン": { type: "パイナップル", unit: "個", location: "野菜室" },
  "マンゴー": { type: "マンゴー", unit: "個", location: "野菜室" },
  "ドラゴンフルーツ": { type: "ドラゴンフルーツ", unit: "個", location: "野菜室" },
  "パパイヤ": { type: "パパイヤ", unit: "個", location: "野菜室" },
  "ブルーベリー": { type: "ブルーベリー", unit: "パック", location: "野菜室" },
  "ラズベリー": { type: "ラズベリー", unit: "パック", location: "野菜室" },
  "ブラックベリー": { type: "ブラックベリー", unit: "パック", location: "野菜室" },
  "びわ": { type: "びわ", unit: "パック", location: "野菜室" },
  "枇杷": { type: "びわ", unit: "パック", location: "野菜室" },
  "いちじく": { type: "いちじく", unit: "パック", location: "野菜室" },
  "無花果": { type: "いちじく", unit: "パック", location: "野菜室" },
  "すもも": { type: "すもも", unit: "パック", location: "野菜室" },
  "プラム": { type: "すもも", unit: "パック", location: "野菜室" },
  "プルーン": { type: "プルーン", unit: "パック", location: "野菜室" },
  "ざくろ": { type: "ざくろ", unit: "個", location: "野菜室" },
  "栗": { type: "栗", unit: "袋", location: "常温" },
  "くり": { type: "栗", unit: "袋", location: "常温" },
  "ココナッツ": { type: "ココナッツ", unit: "個", location: "常温" }
};

const drinkDatabase = {
  "ミネラルウォーター": { type: "水", unit: "ml", location: "常温" },
  "南アルプス天然水": { type: "水", unit: "ml", location: "常温" },
  "おいしい水": { type: "水", unit: "ml", location: "常温" },
  "天然水": { type: "水", unit: "ml", location: "常温" },
  "いろはす": { type: "水", unit: "ml", location: "常温" },
  "い・ろ・は・す": { type: "水", unit: "ml", location: "常温" },
  "エビアン": { type: "水", unit: "ml", location: "常温" },
  "ボルヴィック": { type: "水", unit: "ml", location: "常温" },
  "クリスタルガイザー": { type: "水", unit: "ml", location: "常温" },
  "水": { type: "水", unit: "ml", location: "常温" },

  "午後の紅茶": { type: "お茶", unit: "ml", location: "冷蔵" },
  "健康ミネラルむぎ茶": { type: "お茶", unit: "ml", location: "冷蔵" },
  "おーいお茶": { type: "お茶", unit: "ml", location: "冷蔵" },
  "お〜いお茶": { type: "お茶", unit: "ml", location: "冷蔵" },
  "伊右衛門": { type: "お茶", unit: "ml", location: "冷蔵" },
  "綾鷹": { type: "お茶", unit: "ml", location: "冷蔵" },
  "生茶": { type: "お茶", unit: "ml", location: "冷蔵" },
  "十六茶": { type: "お茶", unit: "ml", location: "冷蔵" },
  "爽健美茶": { type: "お茶", unit: "ml", location: "冷蔵" },
  "ジャスミン茶": { type: "お茶", unit: "ml", location: "冷蔵" },
  "ほうじ茶": { type: "お茶", unit: "ml", location: "冷蔵" },
  "ウーロン茶": { type: "お茶", unit: "ml", location: "冷蔵" },
  "烏龍茶": { type: "お茶", unit: "ml", location: "冷蔵" },
  "麦茶": { type: "お茶", unit: "ml", location: "冷蔵" },
  "緑茶": { type: "お茶", unit: "ml", location: "冷蔵" },
  "紅茶": { type: "お茶", unit: "ml", location: "冷蔵" },
  "お茶": { type: "お茶", unit: "ml", location: "冷蔵" },

  "クラフトボス": { type: "コーヒー", unit: "ml", location: "冷蔵" },
  "ダイドーブレンド": { type: "コーヒー", unit: "ml", location: "冷蔵" },
  "ブラックコーヒー": { type: "コーヒー", unit: "ml", location: "冷蔵" },
  "アイスコーヒー": { type: "コーヒー", unit: "ml", location: "冷蔵" },
  "カフェラテ": { type: "コーヒー", unit: "ml", location: "冷蔵" },
  "カフェオレ": { type: "コーヒー", unit: "ml", location: "冷蔵" },
  "ジョージア": { type: "コーヒー", unit: "ml", location: "冷蔵" },
  "ワンダ": { type: "コーヒー", unit: "ml", location: "冷蔵" },
  "boss": { type: "コーヒー", unit: "ml", location: "冷蔵" },
  "ボス": { type: "コーヒー", unit: "ml", location: "冷蔵" },
  "fire": { type: "コーヒー", unit: "ml", location: "冷蔵" },
  "コーヒー": { type: "コーヒー", unit: "ml", location: "冷蔵" },

  "低脂肪乳": { type: "牛乳", unit: "ml", location: "冷蔵" },
  "無脂肪乳": { type: "牛乳", unit: "ml", location: "冷蔵" },
  "特濃牛乳": { type: "牛乳", unit: "ml", location: "冷蔵" },
  "加工乳": { type: "牛乳", unit: "ml", location: "冷蔵" },
  "牛乳": { type: "牛乳", unit: "ml", location: "冷蔵" },
  "ミルク": { type: "牛乳", unit: "ml", location: "冷蔵" },

  "カルピスウォーター": { type: "ジュース", unit: "ml", location: "冷蔵" },
  "オレンジジュース": { type: "ジュース", unit: "ml", location: "冷蔵" },
  "りんごジュース": { type: "ジュース", unit: "ml", location: "冷蔵" },
  "ぶどうジュース": { type: "ジュース", unit: "ml", location: "冷蔵" },
  "野菜ジュース": { type: "ジュース", unit: "ml", location: "冷蔵" },
  "トロピカーナ": { type: "ジュース", unit: "ml", location: "冷蔵" },
  "バヤリース": { type: "ジュース", unit: "ml", location: "冷蔵" },
  "なっちゃん": { type: "ジュース", unit: "ml", location: "冷蔵" },
  "カルピス": { type: "ジュース", unit: "ml", location: "冷蔵" },
  "レッドブル": { type: "ジュース", unit: "ml", location: "冷蔵" },
  "redbull": { type: "ジュース", unit: "ml", location: "冷蔵" },
  "モンスターエナジー": { type: "ジュース", unit: "ml", location: "冷蔵" },
  "モンスター": { type: "ジュース", unit: "ml", location: "冷蔵" },
  "monster": { type: "ジュース", unit: "ml", location: "冷蔵" },
  "dole": { type: "ジュース", unit: "ml", location: "冷蔵" },
  "qoo": { type: "ジュース", unit: "ml", location: "冷蔵" },
  "ジュース": { type: "ジュース", unit: "ml", location: "冷蔵" },

  "ドクターペッパー": { type: "炭酸飲料", unit: "ml", location: "冷蔵" },
  "三ツ矢サイダー": { type: "炭酸飲料", unit: "ml", location: "冷蔵" },
  "ジンジャーエール": { type: "炭酸飲料", unit: "ml", location: "冷蔵" },
  "オロナミンc": { type: "炭酸飲料", unit: "ml", location: "冷蔵" },
  "デカビタc": { type: "炭酸飲料", unit: "ml", location: "冷蔵" },
  "ccレモン": { type: "炭酸飲料", unit: "ml", location: "冷蔵" },
  "c.c.レモン": { type: "炭酸飲料", unit: "ml", location: "冷蔵" },
  "キレートレモン": { type: "炭酸飲料", unit: "ml", location: "冷蔵" },
  "コカコーラ": { type: "炭酸飲料", unit: "ml", location: "冷蔵" },
  "コカ・コーラ": { type: "炭酸飲料", unit: "ml", location: "冷蔵" },
  "コーラ": { type: "炭酸飲料", unit: "ml", location: "冷蔵" },
  "ペプシ": { type: "炭酸飲料", unit: "ml", location: "冷蔵" },
  "ファンタ": { type: "炭酸飲料", unit: "ml", location: "冷蔵" },
  "スプライト": { type: "炭酸飲料", unit: "ml", location: "冷蔵" },
  "サイダー": { type: "炭酸飲料", unit: "ml", location: "冷蔵" },
  "炭酸飲料": { type: "炭酸飲料", unit: "ml", location: "冷蔵" },
  "炭酸": { type: "炭酸飲料", unit: "ml", location: "冷蔵" },

  "ポカリスエット": { type: "スポーツドリンク", unit: "ml", location: "冷蔵" },
  "イオンウォーター": { type: "スポーツドリンク", unit: "ml", location: "冷蔵" },
  "グリーンダカラ": { type: "スポーツドリンク", unit: "ml", location: "冷蔵" },
  "アクエリアス": { type: "スポーツドリンク", unit: "ml", location: "冷蔵" },
  "アミノバイタル": { type: "スポーツドリンク", unit: "ml", location: "冷蔵" },
  "ポカリ": { type: "スポーツドリンク", unit: "ml", location: "冷蔵" },
  "vaam": { type: "スポーツドリンク", unit: "ml", location: "冷蔵" },
  "スポーツドリンク": { type: "スポーツドリンク", unit: "ml", location: "冷蔵" },

  "キッコーマン豆乳": { type: "豆乳", unit: "ml", location: "冷蔵" },
  "マルサン豆乳": { type: "豆乳", unit: "ml", location: "冷蔵" },
  "無調整豆乳": { type: "豆乳", unit: "ml", location: "冷蔵" },
  "調製豆乳": { type: "豆乳", unit: "ml", location: "冷蔵" },
  "豆乳": { type: "豆乳", unit: "ml", location: "冷蔵" },

  "プレミアムモルツ": { type: "お酒", unit: "本", location: "冷蔵" },
  "スーパードライ": { type: "お酒", unit: "本", location: "冷蔵" },
  "こだわり酒場": { type: "お酒", unit: "本", location: "冷蔵" },
  "角ハイボール": { type: "お酒", unit: "本", location: "冷蔵" },
  "一番搾り": { type: "お酒", unit: "本", location: "冷蔵" },
  "黒ラベル": { type: "お酒", unit: "本", location: "冷蔵" },
  "のどごし生": { type: "お酒", unit: "本", location: "冷蔵" },
  "本麒麟": { type: "お酒", unit: "本", location: "冷蔵" },
  "氷結": { type: "お酒", unit: "本", location: "冷蔵" },
  "ほろよい": { type: "お酒", unit: "本", location: "冷蔵" },
  "ハイボール": { type: "お酒", unit: "本", location: "冷蔵" },
  "チューハイ": { type: "お酒", unit: "本", location: "冷蔵" },
  "ビール": { type: "お酒", unit: "本", location: "冷蔵" },
  "ワイン": { type: "お酒", unit: "本", location: "常温" },
  "日本酒": { type: "お酒", unit: "本", location: "常温" },
  "焼酎": { type: "お酒", unit: "本", location: "常温" },
  "ウイスキー": { type: "お酒", unit: "本", location: "常温" },
  "梅酒": { type: "お酒", unit: "本", location: "常温" },
  "カクテル": { type: "お酒", unit: "本", location: "冷蔵" },
  "お酒": { type: "お酒", unit: "本", location: "常温" }
};

const dairyDatabase = {
  "温泉卵": "卵", "温泉たまご": "卵", "ゆで卵": "卵", "ゆでたまご": "卵",
  "煮卵": "卵", "味付け卵": "卵", "味玉": "卵", "生卵": "卵", "たまご": "卵", "タマゴ": "卵", "卵": "卵",
  "飲むヨーグルト": "ヨーグルト", "のむヨーグルト": "ヨーグルト", "ギリシャヨーグルト": "ヨーグルト",
  "プレーンヨーグルト": "ヨーグルト", "ヨーグルト": "ヨーグルト",
  "スライスチーズ": "チーズ", "とろけるチーズ": "チーズ", "ピザ用チーズ": "チーズ", "粉チーズ": "チーズ",
  "クリームチーズ": "チーズ", "カッテージチーズ": "チーズ", "モッツァレラチーズ": "チーズ",
  "モッツァレラ": "チーズ", "カマンベールチーズ": "チーズ", "カマンベール": "チーズ", "チーズ": "チーズ",
  "無塩バター": "バター", "有塩バター": "バター", "発酵バター": "バター", "マーガリン": "バター", "バター": "バター",
  "ホイップクリーム": "生クリーム", "ホイップ": "生クリーム", "生クリーム": "生クリーム",
  "練乳": "その他", "コンデンスミルク": "その他"
};

const stapleDatabase = {
  "白米": "白米", "ご飯": "白米", "ごはん": "白米", "ライス": "白米", "米": "白米",
  "玄米": "玄米", "もち米": "もち米", "食パン": "食パン", "トースト": "食パン",
  "菓子パン": "菓子パン", "あんぱん": "菓子パン", "アンパン": "菓子パン", "クリームパン": "菓子パン",
  "メロンパン": "菓子パン", "クロワッサン": "菓子パン", "ロールパン": "菓子パン",
  "パスタ": "パスタ", "スパゲッティ": "パスタ", "スパゲティ": "パスタ",
  "うどん": "うどん", "そば": "そば", "蕎麦": "そば", "そうめん": "そうめん", "素麺": "そうめん",
  "ラーメン": "ラーメン", "中華麺": "ラーメン", "焼きそば": "焼きそば", "やきそば": "焼きそば"
};


const frozenFoodDatabase = {
  // お弁当・おかず系
  "冷凍餃子": { type: "お弁当・おかず系", unit: "袋", location: "冷凍" },
  "冷凍ぎょうざ": { type: "お弁当・おかず系", unit: "袋", location: "冷凍" },
  "餃子": { type: "お弁当・おかず系", unit: "袋", location: "冷凍" },
  "ぎょうざ": { type: "お弁当・おかず系", unit: "袋", location: "冷凍" },
  "冷凍シュウマイ": { type: "お弁当・おかず系", unit: "袋", location: "冷凍" },
  "冷凍しゅうまい": { type: "お弁当・おかず系", unit: "袋", location: "冷凍" },
  "シュウマイ": { type: "お弁当・おかず系", unit: "袋", location: "冷凍" },
  "しゅうまい": { type: "お弁当・おかず系", unit: "袋", location: "冷凍" },
  "冷凍春巻き": { type: "お弁当・おかず系", unit: "袋", location: "冷凍" },
  "春巻き": { type: "お弁当・おかず系", unit: "袋", location: "冷凍" },
  "冷凍唐揚げ": { type: "お弁当・おかず系", unit: "袋", location: "冷凍" },
  "冷凍からあげ": { type: "お弁当・おかず系", unit: "袋", location: "冷凍" },
  "唐揚げ": { type: "お弁当・おかず系", unit: "袋", location: "冷凍" },
  "からあげ": { type: "お弁当・おかず系", unit: "袋", location: "冷凍" },
  "冷凍コロッケ": { type: "お弁当・おかず系", unit: "袋", location: "冷凍" },
  "コロッケ": { type: "お弁当・おかず系", unit: "袋", location: "冷凍" },
  "冷凍ハンバーグ": { type: "お弁当・おかず系", unit: "袋", location: "冷凍" },
  "ハンバーグ": { type: "お弁当・おかず系", unit: "袋", location: "冷凍" },
  "冷凍エビフライ": { type: "お弁当・おかず系", unit: "袋", location: "冷凍" },
  "冷凍えびフライ": { type: "お弁当・おかず系", unit: "袋", location: "冷凍" },
  "エビフライ": { type: "お弁当・おかず系", unit: "袋", location: "冷凍" },
  "えびフライ": { type: "お弁当・おかず系", unit: "袋", location: "冷凍" },
  "冷凍とんかつ": { type: "お弁当・おかず系", unit: "袋", location: "冷凍" },
  "とんかつ": { type: "お弁当・おかず系", unit: "袋", location: "冷凍" },
  "冷凍ミートボール": { type: "お弁当・おかず系", unit: "袋", location: "冷凍" },
  "ミートボール": { type: "お弁当・おかず系", unit: "袋", location: "冷凍" },
  "冷凍たこ焼き": { type: "お弁当・おかず系", unit: "袋", location: "冷凍" },
  "たこ焼き": { type: "お弁当・おかず系", unit: "袋", location: "冷凍" },
  "冷凍お好み焼き": { type: "お弁当・おかず系", unit: "袋", location: "冷凍" },
  "お好み焼き": { type: "お弁当・おかず系", unit: "袋", location: "冷凍" },
  "冷凍グラタン": { type: "お弁当・おかず系", unit: "袋", location: "冷凍" },
  "グラタン": { type: "お弁当・おかず系", unit: "袋", location: "冷凍" },

  // 主食系
  "冷凍チャーハン": { type: "主食系", unit: "袋", location: "冷凍" },
  "冷凍炒飯": { type: "主食系", unit: "袋", location: "冷凍" },
  "冷凍ピラフ": { type: "主食系", unit: "袋", location: "冷凍" },
  "冷凍ドリア": { type: "主食系", unit: "袋", location: "冷凍" },
  "冷凍焼きおにぎり": { type: "主食系", unit: "袋", location: "冷凍" },
  "焼きおにぎり": { type: "主食系", unit: "袋", location: "冷凍" },
  "冷凍うどん": { type: "主食系", unit: "袋", location: "冷凍" },
  "冷凍そば": { type: "主食系", unit: "袋", location: "冷凍" },
  "冷凍蕎麦": { type: "主食系", unit: "袋", location: "冷凍" },
  "冷凍パスタ": { type: "主食系", unit: "袋", location: "冷凍" },
  "冷凍スパゲッティ": { type: "主食系", unit: "袋", location: "冷凍" },
  "冷凍スパゲティ": { type: "主食系", unit: "袋", location: "冷凍" },
  "冷凍ラーメン": { type: "主食系", unit: "袋", location: "冷凍" },

  // 冷凍野菜・カット野菜
  "冷凍ブロッコリー": { type: "冷凍野菜・カット野菜", unit: "袋", location: "冷凍" },
  "冷凍ほうれん草": { type: "冷凍野菜・カット野菜", unit: "袋", location: "冷凍" },
  "冷凍ほうれんそう": { type: "冷凍野菜・カット野菜", unit: "袋", location: "冷凍" },
  "冷凍枝豆": { type: "冷凍野菜・カット野菜", unit: "袋", location: "冷凍" },
  "冷凍コーン": { type: "冷凍野菜・カット野菜", unit: "袋", location: "冷凍" },
  "冷凍ミックスベジタブル": { type: "冷凍野菜・カット野菜", unit: "袋", location: "冷凍" },
  "ミックスベジタブル": { type: "冷凍野菜・カット野菜", unit: "袋", location: "冷凍" },
  "冷凍オクラ": { type: "冷凍野菜・カット野菜", unit: "袋", location: "冷凍" },
  "冷凍かぼちゃ": { type: "冷凍野菜・カット野菜", unit: "袋", location: "冷凍" },
  "冷凍カボチャ": { type: "冷凍野菜・カット野菜", unit: "袋", location: "冷凍" },
  "冷凍玉ねぎ": { type: "冷凍野菜・カット野菜", unit: "袋", location: "冷凍" },
  "冷凍玉葱": { type: "冷凍野菜・カット野菜", unit: "袋", location: "冷凍" },
  "冷凍カット玉ねぎ": { type: "冷凍野菜・カット野菜", unit: "袋", location: "冷凍" },
  "冷凍ネギ": { type: "冷凍野菜・カット野菜", unit: "袋", location: "冷凍" },
  "冷凍ねぎ": { type: "冷凍野菜・カット野菜", unit: "袋", location: "冷凍" },
  "冷凍カットねぎ": { type: "冷凍野菜・カット野菜", unit: "袋", location: "冷凍" },
  "冷凍きのこミックス": { type: "冷凍野菜・カット野菜", unit: "袋", location: "冷凍" },
  "きのこミックス": { type: "冷凍野菜・カット野菜", unit: "袋", location: "冷凍" },

  // スイーツ系
  "冷凍アイス": { type: "スイーツ系", unit: "個", location: "冷凍" },
  "アイス": { type: "スイーツ系", unit: "個", location: "冷凍" },
  "アイスクリーム": { type: "スイーツ系", unit: "個", location: "冷凍" },
  "冷凍今川焼き": { type: "スイーツ系", unit: "個", location: "冷凍" },
  "今川焼き": { type: "スイーツ系", unit: "個", location: "冷凍" },
  "大判焼き": { type: "スイーツ系", unit: "個", location: "冷凍" },
  "冷凍ワッフル": { type: "スイーツ系", unit: "個", location: "冷凍" },
  "ワッフル": { type: "スイーツ系", unit: "個", location: "冷凍" },
  "冷凍ケーキ": { type: "スイーツ系", unit: "個", location: "冷凍" },
  "冷凍シュークリーム": { type: "スイーツ系", unit: "個", location: "冷凍" },
  "冷凍ブルーベリー": { type: "スイーツ系", unit: "個", location: "冷凍" },
  "冷凍マンゴー": { type: "スイーツ系", unit: "個", location: "冷凍" },
  "冷凍いちご": { type: "スイーツ系", unit: "個", location: "冷凍" },
  "冷凍イチゴ": { type: "スイーツ系", unit: "個", location: "冷凍" },

  // 調理用の冷凍肉・魚
  "冷凍鶏肉": { type: "調理用の冷凍肉・魚", unit: "g", location: "冷凍" },
  "冷凍鶏もも": { type: "調理用の冷凍肉・魚", unit: "g", location: "冷凍" },
  "冷凍鶏むね": { type: "調理用の冷凍肉・魚", unit: "g", location: "冷凍" },
  "冷凍豚肉": { type: "調理用の冷凍肉・魚", unit: "g", location: "冷凍" },
  "冷凍豚バラ": { type: "調理用の冷凍肉・魚", unit: "g", location: "冷凍" },
  "冷凍豚こま": { type: "調理用の冷凍肉・魚", unit: "g", location: "冷凍" },
  "冷凍牛肉": { type: "調理用の冷凍肉・魚", unit: "g", location: "冷凍" },
  "冷凍牛こま": { type: "調理用の冷凍肉・魚", unit: "g", location: "冷凍" },
  "冷凍ひき肉": { type: "調理用の冷凍肉・魚", unit: "g", location: "冷凍" },
  "冷凍挽き肉": { type: "調理用の冷凍肉・魚", unit: "g", location: "冷凍" },
  "冷凍エビ": { type: "調理用の冷凍肉・魚", unit: "g", location: "冷凍" },
  "冷凍えび": { type: "調理用の冷凍肉・魚", unit: "g", location: "冷凍" },
  "冷凍海老": { type: "調理用の冷凍肉・魚", unit: "g", location: "冷凍" },
  "冷凍イカ": { type: "調理用の冷凍肉・魚", unit: "g", location: "冷凍" },
  "冷凍いか": { type: "調理用の冷凍肉・魚", unit: "g", location: "冷凍" },
  "冷凍あさり": { type: "調理用の冷凍肉・魚", unit: "g", location: "冷凍" },
  "冷凍シーフードミックス": { type: "調理用の冷凍肉・魚", unit: "g", location: "冷凍" },
  "シーフードミックス": { type: "調理用の冷凍肉・魚", unit: "g", location: "冷凍" },
  "冷凍鮭": { type: "調理用の冷凍肉・魚", unit: "g", location: "冷凍" },
  "冷凍サバ": { type: "調理用の冷凍肉・魚", unit: "g", location: "冷凍" },
  "冷凍さば": { type: "調理用の冷凍肉・魚", unit: "g", location: "冷凍" },
  "冷凍鯖": { type: "調理用の冷凍肉・魚", unit: "g", location: "冷凍" }
};

const processedFoodDatabase = {
  // 缶詰・瓶詰
  "ツナ缶（4缶）": { type: "缶詰・瓶詰", unit: "パック", location: "常温" },
  "ツナ缶(4缶)": { type: "缶詰・瓶詰", unit: "パック", location: "常温" },
  "ツナ缶（3缶）": { type: "缶詰・瓶詰", unit: "パック", location: "常温" },
  "ツナ缶(3缶)": { type: "缶詰・瓶詰", unit: "パック", location: "常温" },
  "ツナ缶": { type: "缶詰・瓶詰", unit: "個", location: "常温" },
  "シーチキン": { type: "缶詰・瓶詰", unit: "個", location: "常温" },
  "さば缶": { type: "缶詰・瓶詰", unit: "個", location: "常温" },
  "サバ缶": { type: "缶詰・瓶詰", unit: "個", location: "常温" },
  "鯖缶": { type: "缶詰・瓶詰", unit: "個", location: "常温" },
  "コーン缶": { type: "缶詰・瓶詰", unit: "個", location: "常温" },
  "焼き鳥缶": { type: "缶詰・瓶詰", unit: "個", location: "常温" },
  "やきとり缶": { type: "缶詰・瓶詰", unit: "個", location: "常温" },
  "フルーツ缶": { type: "缶詰・瓶詰", unit: "個", location: "常温" },
  "ごはんですよ": { type: "缶詰・瓶詰", unit: "個", location: "常温" },
  "なめ茸": { type: "缶詰・瓶詰", unit: "個", location: "常温" },
  "鮭フレーク": { type: "缶詰・瓶詰", unit: "個", location: "常温" },
  "缶詰": { type: "缶詰・瓶詰", unit: "個", location: "常温" },
  "瓶詰": { type: "缶詰・瓶詰", unit: "個", location: "常温" },

  // レトルト
  "レトルトカレー": { type: "レトルト", unit: "個", location: "常温" },
  "ハヤシライス": { type: "レトルト", unit: "個", location: "常温" },
  "レトルト牛丼": { type: "レトルト", unit: "個", location: "常温" },
  "レトルト親子丼": { type: "レトルト", unit: "個", location: "常温" },
  "レトルト中華丼": { type: "レトルト", unit: "個", location: "常温" },
  "パスタソース": { type: "レトルト", unit: "個", location: "常温" },
  "レトルト食品": { type: "レトルト", unit: "個", location: "常温" },
  "レトルト": { type: "レトルト", unit: "個", location: "常温" },

  // 加工肉
  "スライスハム": { type: "加工肉", unit: "パック", location: "冷蔵" },
  "生ハム": { type: "加工肉", unit: "パック", location: "冷蔵" },
  "3連ハム": { type: "加工肉", unit: "束", location: "冷蔵" },
  "三連ハム": { type: "加工肉", unit: "束", location: "冷蔵" },
  "ベーコン": { type: "加工肉", unit: "パック", location: "冷蔵" },
  "ウインナー": { type: "加工肉", unit: "袋", location: "冷蔵" },
  "ウィンナー": { type: "加工肉", unit: "袋", location: "冷蔵" },
  "ソーセージ": { type: "加工肉", unit: "袋", location: "冷蔵" },
  "ハム": { type: "加工肉", unit: "パック", location: "冷蔵" },

  // 練り物
  "ちくわ": { type: "練り物", unit: "パック", location: "冷蔵" },
  "竹輪": { type: "練り物", unit: "パック", location: "冷蔵" },
  "かまぼこ": { type: "練り物", unit: "パック", location: "冷蔵" },
  "蒲鉾": { type: "練り物", unit: "パック", location: "冷蔵" },
  "はんぺん": { type: "練り物", unit: "パック", location: "冷蔵" },
  "なると": { type: "練り物", unit: "パック", location: "冷蔵" },
  "ナルト": { type: "練り物", unit: "パック", location: "冷蔵" },
  "さつま揚げ": { type: "練り物", unit: "パック", location: "冷蔵" },

  // 大豆食品
  "ミニ豆腐（4個入り）": { type: "大豆食品", unit: "パック", location: "冷蔵" },
  "ミニ豆腐(4個入り)": { type: "大豆食品", unit: "パック", location: "冷蔵" },
  "ミニ豆腐": { type: "大豆食品", unit: "パック", location: "冷蔵" },
  "木綿豆腐": { type: "大豆食品", unit: "丁", location: "冷蔵" },
  "絹ごし豆腐": { type: "大豆食品", unit: "丁", location: "冷蔵" },
  "絹豆腐": { type: "大豆食品", unit: "丁", location: "冷蔵" },
  "豆腐": { type: "大豆食品", unit: "丁", location: "冷蔵" },
  "納豆（3個入り）": { type: "大豆食品", unit: "パック", location: "冷蔵" },
  "納豆(3個入り)": { type: "大豆食品", unit: "パック", location: "冷蔵" },
  "納豆": { type: "大豆食品", unit: "パック", location: "冷蔵" },
  "油揚げ": { type: "大豆食品", unit: "パック", location: "冷蔵" },
  "厚揚げ": { type: "大豆食品", unit: "パック", location: "冷蔵" },
  "こんにゃく": { type: "大豆食品", unit: "袋", location: "冷蔵" },
  "蒟蒻": { type: "大豆食品", unit: "袋", location: "冷蔵" },

  // 漬物
  "キムチ": { type: "漬物", unit: "パック", location: "冷蔵" },
  "たくあん": { type: "漬物", unit: "パック", location: "冷蔵" },
  "沢庵": { type: "漬物", unit: "パック", location: "冷蔵" },
  "浅漬け": { type: "漬物", unit: "パック", location: "冷蔵" },
  "漬物": { type: "漬物", unit: "パック", location: "冷蔵" }
};

const categoryDisplayNames = {
  "肉": "🥩 肉",
  "魚": "🐟 魚",
  "野菜": "🥬 野菜",
  "果物": "🍎 果物",
  "卵・乳製品": "🥚 卵・乳製品",
  "主食": "🍚 主食",
  "飲み物": "🥤 飲み物",
  "冷凍食品": "❄️ 冷凍食品",
  "加工食品": "🍱 加工食品",
  "その他": "📦 その他",
  "すべて": "📋 すべて"
};

const typeDisplayNames = {
  "鶏肉": "🐓 鶏肉", "豚肉": "🐖 豚肉", "牛肉": "🐄 牛肉", "牛豚合い挽き": "🥩 牛豚合い挽き", "ジビエ": "🦌 ジビエ",
  "鮭": "🐟 鮭", "マグロ": "🐟 マグロ", "サバ": "🐟 サバ", "アジ": "🐟 アジ", "ブリ": "🐟 ブリ", "カツオ": "🐟 カツオ", "タイ": "🐟 タイ", "イワシ": "🐟 イワシ", "サンマ": "🐟 サンマ", "タラ": "🐟 タラ", "カレイ": "🐟 カレイ", "ヒラメ": "🐟 ヒラメ", "うなぎ": "🐟 うなぎ", "エビ": "🦐 エビ", "カニ": "🦀 カニ", "イカ": "🦑 イカ", "タコ": "🐙 タコ", "貝類": "🐚 貝類", "刺身": "🍣 刺身",
  "葉物": "🥬 葉物", "根菜": "🥕 根菜", "実野菜": "🍅 実野菜", "花野菜": "🥦 花野菜", "茎野菜": "🌱 茎野菜", "香味野菜": "🌿 香味野菜", "豆類": "🫛 豆類", "きのこ": "🍄 きのこ",
  "卵": "🥚 卵", "チーズ": "🧀 チーズ", "ヨーグルト": "🥣 ヨーグルト", "バター": "🧈 バター", "生クリーム": "🥛 生クリーム",
  "白米": "🍚 白米", "玄米": "🌾 玄米", "もち米": "🍚 もち米", "食パン": "🍞 食パン", "菓子パン": "🥐 菓子パン", "パスタ": "🍝 パスタ", "うどん": "🍜 うどん", "そば": "🥢 そば", "そうめん": "🥢 そうめん", "ラーメン": "🍜 ラーメン", "焼きそば": "🍜 焼きそば",
  "水": "💧 水", "お茶": "🍵 お茶", "コーヒー": "☕ コーヒー", "牛乳": "🥛 牛乳", "ジュース": "🧃 ジュース", "炭酸飲料": "🥤 炭酸飲料", "お酒": "🍺 お酒", "スポーツドリンク": "🏃 スポーツドリンク", "豆乳": "🌱 豆乳",
  "お弁当・おかず系": "🍱 お弁当・おかず系", "主食系": "🍚 主食系", "冷凍野菜・カット野菜": "🥦 冷凍野菜・カット野菜", "スイーツ系": "🍰 スイーツ系", "調理用の冷凍肉・魚": "🥩 調理用の冷凍肉・魚",
  "缶詰・瓶詰": "🥫 缶詰・瓶詰", "レトルト": "🍛 レトルト", "加工肉": "🥓 加工肉", "練り物": "🍥 練り物", "大豆食品": "🫘 大豆食品", "漬物": "🥒 漬物",
  "その他": "📦 その他"
};

function getCategoryDisplayName(category) {
  return categoryDisplayNames[category] || category || "📦 その他";
}

function getTypeDisplayName(type) {
  return typeDisplayNames[type] || type || "";
}

const foodTypes = {
  "肉": ["鶏肉", "豚肉", "牛肉", "牛豚合い挽き", "ジビエ"],
  "魚": ["鮭", "マグロ", "サバ", "アジ", "ブリ", "カツオ", "タイ", "イワシ", "サンマ", "タラ", "カレイ", "ヒラメ", "うなぎ", "エビ", "カニ", "イカ", "タコ", "貝類", "刺身", "その他"],
  "野菜": ["葉物", "根菜", "実野菜", "花野菜", "茎野菜", "香味野菜", "豆類", "きのこ", "その他"],
  "果物": ["りんご", "バナナ", "みかん", "オレンジ", "甘夏", "はっさく", "伊予柑", "デコポン", "ポンカン", "グレープフルーツ", "レモン", "ライム", "ゆず", "すだち", "かぼす", "ぶどう", "いちご", "キウイ", "桃", "梨", "洋梨", "柿", "さくらんぼ", "スイカ", "メロン", "パイナップル", "マンゴー", "ドラゴンフルーツ", "パパイヤ", "ブルーベリー", "ラズベリー", "ブラックベリー", "びわ", "いちじく", "すもも", "プルーン", "ざくろ", "栗", "ココナッツ", "その他"],
  "卵・乳製品": ["卵", "チーズ", "ヨーグルト", "バター", "生クリーム", "その他"],
  "主食": ["白米", "玄米", "もち米", "食パン", "菓子パン", "パスタ", "うどん", "そば", "そうめん", "ラーメン", "焼きそば", "その他"],
  "冷凍食品": ["お弁当・おかず系", "主食系", "冷凍野菜・カット野菜", "スイーツ系", "調理用の冷凍肉・魚", "その他"],
  "加工食品": ["缶詰・瓶詰", "レトルト", "加工肉", "練り物", "大豆食品", "漬物", "その他"],
  "飲み物": ["水", "お茶", "コーヒー", "牛乳", "ジュース", "炭酸飲料", "お酒", "スポーツドリンク", "豆乳", "その他"]
};

const foodDatabaseGroups = [
  { category: "冷凍食品", data: frozenFoodDatabase },
  { category: "飲み物", data: drinkDatabase },
  { category: "加工食品", data: processedFoodDatabase },
  { category: "果物", data: fruitDatabase },
  { category: "野菜", data: vegetableDatabase },
  { category: "肉", data: meatDatabase },
  { category: "魚", data: fishDatabase },
  { category: "卵・乳製品", data: dairyDatabase },
  { category: "主食", data: stapleDatabase }
];

function normalizeFoodName(value) {
  return String(value || "").replace(/\s+/g, "").toLowerCase();
}

function findFoodMatch(foodName) {
  for (const group of foodDatabaseGroups) {
    const matchedName = Object.keys(group.data)
      .sort(function(a, b) { return b.length - a.length; })
      .find(function(name) {
        return foodName.includes(normalizeFoodName(name));
      });

    if (matchedName) {
      const raw = group.data[matchedName];
      const detail = typeof raw === "string" ? { type: raw } : raw;
      return {
        category: group.category,
        type: detail.type || "",
        unit: detail.unit || getDefaultUnitForCategory(group.category),
        location: detail.location || getDefaultLocationForCategory(group.category),
        matchedName: matchedName
      };
    }
  }
  return null;
}

function autoSelectFoodCategory() {
  const foodNameInput = document.getElementById("foodName");
  const foodName = normalizeFoodName(foodNameInput.value);

  if (!foodName) {
    foodCategoryManuallyChanged = false;
    foodTypeManuallyChanged = false;
    foodUnitManuallyChanged = false;
    foodLocationManuallyChanged = false;
    updateAutoDetectNote("");
    renderFoodInputSuggestions();
    return;
  }

  const match = findFoodMatch(foodName);
  if (!match) {
    updateAutoDetectNote("自動判定できませんでした。カテゴリーと種類は手動で選べます。");
    renderFoodInputSuggestions();
    return;
  }

  if (foodCategoryManuallyChanged) {
    updateAutoDetectNote("手動で選んだカテゴリーを優先しています。");
    renderFoodInputSuggestions();
    return;
  }

  document.getElementById("foodCategory").value = match.category;
  setDefaultUnitByCategory(true);

  if (!foodTypeManuallyChanged) {
    document.getElementById("foodType").value = match.type;
  }

  if (!foodUnitManuallyChanged) {
    document.getElementById("foodUnit").value = match.unit;
  }
  if (!foodLocationManuallyChanged) {
    document.getElementById("foodLocation").value = getLearnedLocation(foodName) || match.location;
  }
  updateAutoDetectNote(getCategoryDisplayName(match.category) + " ＞ " + getTypeDisplayName(match.type) + "として判定しました");
  renderFoodInputSuggestions();
}

function handleManualCategoryChange() {
  foodCategoryManuallyChanged = true;
  foodTypeManuallyChanged = false;
  setDefaultUnitByCategory(false);
  updateAutoDetectNote("手動で選んだカテゴリーを優先しています。");
  renderFoodInputSuggestions();
}

function handleManualTypeChange() {
  foodTypeManuallyChanged = true;
  updateAutoDetectNote("手動で選んだ種類を優先しています。");
  renderFoodInputSuggestions();
}

function handleManualUnitChange() {
  foodUnitManuallyChanged = true;
}

function handleManualLocationChange() {
  foodLocationManuallyChanged = true;
}


function updateAutoDetectNote(message) {
  const note = document.getElementById("foodAutoDetectNote");
  if (note) note.textContent = message || "";
}

function getDefaultUnitForCategory(category) {
  if (category === "肉" || category === "魚") return "g";
  if (category === "飲み物") return "ml";
  if (category === "主食") return "袋";
  if (category === "冷凍食品") return "袋";
  if (category === "加工食品") return "個";
  return "個";
}

function getDefaultLocationForCategory(category) {
  if (category === "冷凍食品") return "冷凍";
  if (category === "野菜" || category === "果物") return "野菜室";
  if (category === "主食") return "常温";
  return "冷蔵";
}

function setDefaultUnitByCategory(preserveCurrentValues) {
  const category = document.getElementById("foodCategory").value;
  const unit = document.getElementById("foodUnit");
  const location = document.getElementById("foodLocation");
  const foodTypeField = document.getElementById("foodTypeField");
  const foodType = document.getElementById("foodType");
  const previousType = foodType.value;

  if (foodTypes[category]) {
    foodTypeField.style.display = "block";
    foodType.innerHTML = '<option value="">選択してください</option>';
    foodTypes[category].forEach(function(item) {
      const option = document.createElement("option");
      option.value = item;
      option.textContent = getTypeDisplayName(item);
      foodType.appendChild(option);
    });
    if (preserveCurrentValues && foodTypes[category].includes(previousType)) {
      foodType.value = previousType;
    }
  } else {
    foodTypeField.style.display = "none";
    foodType.innerHTML = '<option value="">選択してください</option>';
  }

  if (!preserveCurrentValues) {
    unit.value = getDefaultUnitForCategory(category);
    location.value = getDefaultLocationForCategory(category);
  }
}

const drinkVariantDatabase = [
  { keys: ["コーラ", "コカコーラ", "cocacola"], variants: [
    { name: "コカ・コーラ", capacity: "500ml", type: "炭酸飲料" },
    { name: "コカ・コーラ", capacity: "700ml", type: "炭酸飲料" },
    { name: "コカ・コーラ", capacity: "1.5L", type: "炭酸飲料" },
    { name: "コカ・コーラ", capacity: "2L", type: "炭酸飲料" },
    { name: "ペプシ", capacity: "600ml", type: "炭酸飲料" }
  ]},
  { keys: ["ファンタ"], variants: [
    { name: "ファンタ", capacity: "500ml", type: "炭酸飲料" },
    { name: "ファンタ", capacity: "700ml", type: "炭酸飲料" },
    { name: "ファンタ", capacity: "1.5L", type: "炭酸飲料" }
  ]},
  { keys: ["水", "天然水", "ミネラルウォーター", "いろはす"], variants: [
    { name: "水", capacity: "500ml", type: "水" },
    { name: "水", capacity: "600ml", type: "水" },
    { name: "水", capacity: "2L", type: "水" },
    { name: "い・ろ・は・す", capacity: "540ml", type: "水" }
  ]},
  { keys: ["お茶", "緑茶", "麦茶", "烏龍茶", "綾鷹", "伊右衛門", "おーいお茶", "お〜いお茶"], variants: [
    { name: "お茶", capacity: "500ml", type: "お茶" },
    { name: "お茶", capacity: "600ml", type: "お茶" },
    { name: "お茶", capacity: "2L", type: "お茶" },
    { name: "綾鷹", capacity: "650ml", type: "お茶" },
    { name: "伊右衛門", capacity: "600ml", type: "お茶" }
  ]},
  { keys: ["コーヒー", "boss", "ボス", "ジョージア", "ワンダ", "ucc"], variants: [
    { name: "コーヒー", capacity: "185ml", type: "コーヒー" },
    { name: "コーヒー", capacity: "500ml", type: "コーヒー" },
    { name: "コーヒー", capacity: "900ml", type: "コーヒー" },
    { name: "クラフトボス", capacity: "500ml", type: "コーヒー" }
  ]},
  { keys: ["ジュース", "カルピス", "なっちゃん", "qoo", "野菜生活", "トロピカーナ"], variants: [
    { name: "ジュース", capacity: "200ml", type: "ジュース" },
    { name: "ジュース", capacity: "500ml", type: "ジュース" },
    { name: "ジュース", capacity: "1L", type: "ジュース" },
    { name: "カルピスウォーター", capacity: "500ml", type: "ジュース" }
  ]},
  { keys: ["レッドブル", "redbull", "モンスター", "monster"], variants: [
    { name: "レッドブル", capacity: "250ml", type: "ジュース" },
    { name: "レッドブル", capacity: "355ml", type: "ジュース" },
    { name: "モンスター", capacity: "355ml", type: "ジュース" },
    { name: "モンスター", capacity: "500ml", type: "ジュース" }
  ]},
  { keys: ["ポカリ", "ポカリスエット", "アクエリアス", "スポーツドリンク", "グリーンダカラ"], variants: [
    { name: "スポーツドリンク", capacity: "500ml", type: "スポーツドリンク" },
    { name: "スポーツドリンク", capacity: "900ml", type: "スポーツドリンク" },
    { name: "スポーツドリンク", capacity: "2L", type: "スポーツドリンク" },
    { name: "ポカリスエット", capacity: "500ml", type: "スポーツドリンク" },
    { name: "アクエリアス", capacity: "500ml", type: "スポーツドリンク" }
  ]},
  { keys: ["豆乳", "調製豆乳", "無調整豆乳"], variants: [
    { name: "豆乳", capacity: "200ml", type: "豆乳" },
    { name: "豆乳", capacity: "500ml", type: "豆乳" },
    { name: "豆乳", capacity: "1L", type: "豆乳" }
  ]},
  { keys: ["ビール", "チューハイ", "ハイボール", "氷結", "ほろよい", "お酒"], variants: [
    { name: "ビール", capacity: "350ml", type: "お酒" },
    { name: "ビール", capacity: "500ml", type: "お酒" },
    { name: "チューハイ", capacity: "350ml", type: "お酒" },
    { name: "ハイボール", capacity: "350ml", type: "お酒" },
    { name: "ハイボール", capacity: "500ml", type: "お酒" }
  ]},
  { keys: ["牛乳", "ミルク", "低脂肪乳", "無脂肪乳"], variants: [
    { name: "牛乳", capacity: "250ml", type: "牛乳" },
    { name: "牛乳", capacity: "500ml", type: "牛乳" },
    { name: "牛乳", capacity: "1000ml", type: "牛乳" }
  ]}
];

function findDrinkVariantGroup(inputName) {
  const normalized = normalizeFoodName(inputName);
  if (!normalized) return null;
  return drinkVariantDatabase.find(function(group) {
    return group.keys.some(function(key) {
      return normalized.includes(normalizeFoodName(key));
    });
  }) || null;
}

function getDrinkVariantPreferenceKey() {
  return document.getElementById("drinkVariantLearningKey").value || normalizeFoodName(document.getElementById("foodName").value);
}

function getLearnedDrinkVariant(key) {
  if (!foodLearningEnabled || !key) return "";
  const bucket = drinkVariantPreferences[key];
  if (!bucket || typeof bucket !== "object") return "";
  const entries = Object.keys(bucket).map(function(value) {
    return { value: value, count: Number(bucket[value] || 0) };
  }).sort(function(a, b) { return b.count - a.count; });
  if (!entries.length || entries[0].count < 3) return "";
  if (entries[1] && entries[1].count === entries[0].count) return "";
  return entries[0].value;
}

function renderDrinkVariantSuggestions() {
  const area = document.getElementById("drinkVariantSuggestionArea");
  const container = document.getElementById("drinkVariantSuggestionButtons");
  const capacityDisplay = document.getElementById("drinkCapacityDisplay");
  if (!area || !container || !capacityDisplay) return;

  const foodName = document.getElementById("foodName").value;
  const category = document.getElementById("foodCategory").value;
  const group = findDrinkVariantGroup(foodName);
  const selectedCapacity = document.getElementById("foodCapacity").value;

  if (!group || category !== "飲み物") {
    area.style.display = "none";
    container.innerHTML = "";
    capacityDisplay.textContent = "";
    if (category !== "飲み物") document.getElementById("foodCapacity").value = "";
    return;
  }

  const existingKey = document.getElementById("drinkVariantLearningKey").value;
  const key = selectedCapacity && existingKey ? existingKey : normalizeFoodName(foodName);
  document.getElementById("drinkVariantLearningKey").value = key;
  const learnedValue = getLearnedDrinkVariant(key);
  const variants = group.variants.slice().sort(function(a, b) {
    const av = a.name + "|" + a.capacity;
    const bv = b.name + "|" + b.capacity;
    if (av === learnedValue) return -1;
    if (bv === learnedValue) return 1;
    return 0;
  }).slice(0, 5);

  area.style.display = "block";
  container.innerHTML = variants.map(function(variant) {
    const value = variant.name + "|" + variant.capacity;
    const learned = value === learnedValue;
    return '<button class="suggestion-button' + (learned ? ' learned' : '') + '" type="button" onclick="applyDrinkVariant(\'' +
      escapeForAttribute(variant.name) + '\',\'' + escapeForAttribute(variant.capacity) + '\',\'' + escapeForAttribute(variant.type) + '\')">' +
      (learned ? '⭐ ' : '') + escapeHtml(variant.name + " " + variant.capacity) + '</button>';
  }).join("");
  capacityDisplay.textContent = selectedCapacity ? "選択中の容量：" + selectedCapacity : "容量を選ぶと、数量は本数で入力できます";
}

function applyDrinkVariant(name, capacity, type) {
  const learningKey = document.getElementById("drinkVariantLearningKey").value ||
    normalizeFoodName(document.getElementById("foodName").value);
  document.getElementById("foodName").value = name;
  document.getElementById("foodCategory").value = "飲み物";
  setDefaultUnitByCategory(true);
  document.getElementById("foodType").value = type;
  document.getElementById("foodLocation").value = "冷蔵";
  document.getElementById("foodCapacity").value = capacity;
  document.getElementById("drinkVariantLearningKey").value = learningKey;
  document.getElementById("foodAmount").value = "1";
  document.getElementById("foodUnit").value = "本";
  foodUnitManuallyChanged = true;
  foodLocationManuallyChanged = true;
  updateAutoDetectNote(getCategoryDisplayName("飲み物") + " ＞ " + getTypeDisplayName(type) + "として判定しました");
  renderFoodInputSuggestions();
}

function learnDrinkVariant(key, name, capacity) {
  if (!foodLearningEnabled || !key || !capacity) return;
  if (!drinkVariantPreferences[key]) drinkVariantPreferences[key] = {};
  const value = String(name) + "|" + String(capacity);
  drinkVariantPreferences[key][value] = Number(drinkVariantPreferences[key][value] || 0) + 1;
  localStorage.setItem(DRINK_VARIANT_PREFERENCES_STORAGE_KEY, JSON.stringify(drinkVariantPreferences));
}

function getFoodPreferenceKey(name) {
  return normalizeFoodName(name || document.getElementById("foodName").value);
}

function getPreferenceBucket(name) {
  const key = getFoodPreferenceKey(name);
  if (!key) return null;
  if (!foodPreferences[key]) {
    foodPreferences[key] = { amounts: {}, locations: {}, expiryDays: {} };
  }
  return foodPreferences[key];
}

function incrementPreference(bucket, groupName, value) {
  if (!bucket || value === undefined || value === null || value === "") return;
  if (!bucket[groupName]) bucket[groupName] = {};
  const key = String(value);
  bucket[groupName][key] = Number(bucket[groupName][key] || 0) + 1;
}

function getMostUsedValue(values) {
  if (!values || typeof values !== "object") return "";
  return Object.keys(values).sort(function(a, b) {
    return Number(values[b] || 0) - Number(values[a] || 0);
  })[0] || "";
}

function getLearnedLocation(name) {
  if (!foodLearningEnabled) return "";
  const bucket = foodPreferences[getFoodPreferenceKey(name)];
  return bucket ? getMostUsedValue(bucket.locations) : "";
}

function learnFoodPreferences(name, amount, unit, expiry, purchaseDate, location) {
  if (!foodLearningEnabled) return;
  const bucket = getPreferenceBucket(name);
  if (!bucket) return;

  if (String(amount).trim() !== "") {
    incrementPreference(bucket, "amounts", String(amount) + "|" + String(unit || ""));
  }
  incrementPreference(bucket, "locations", location);

  if (expiry) {
    const base = purchaseDate ? new Date(purchaseDate + "T00:00:00") : new Date();
    base.setHours(0, 0, 0, 0);
    const expiryDate = new Date(expiry + "T00:00:00");
    const days = Math.round((expiryDate - base) / 86400000);
    if (Number.isFinite(days) && days >= 0 && days <= 3650) {
      incrementPreference(bucket, "expiryDays", days);
    }
  }

  localStorage.setItem(FOOD_PREFERENCES_STORAGE_KEY, JSON.stringify(foodPreferences));
}

function toggleFoodLearning() {
  const checkbox = document.getElementById("foodLearningEnabled");
  foodLearningEnabled = checkbox ? checkbox.checked : true;
  localStorage.setItem(FOOD_LEARNING_ENABLED_KEY, String(foodLearningEnabled));
  renderFoodInputSuggestions();
}

function syncFoodLearningToggle() {
  const checkbox = document.getElementById("foodLearningEnabled");
  if (checkbox) checkbox.checked = foodLearningEnabled;
}

function makeAmountCandidate(amount, unit, label) {
  return { amount: String(amount), unit: unit, label: label || (String(amount) + unit) };
}

function getBaseAmountCandidates() {
  const name = normalizeFoodName(
    document.getElementById("foodName").value
  );
  const category = document.getElementById("foodCategory").value;
  const type = document.getElementById("foodType").value;

  if (!name) {
    return [];
  }

  // 卵・乳製品に加えて、飲み物は選択した容量を「本数」で管理する。
  if (category === "飲み物" && document.getElementById("foodCapacity").value) {
    return [1, 2, 3, 6, 24].map(function(value) {
      return makeAmountCandidate(value, "本");
    });
  }

  if (
    name.includes("温泉卵") ||
    name.includes("温泉たまご") ||
    name.includes("ゆで卵") ||
    name.includes("ゆでたまご") ||
    name.includes("煮卵") ||
    name.includes("味付け卵") ||
    name.includes("味玉") ||
    name.includes("生卵") ||
    name.includes("たまご") ||
    name.includes("タマゴ") ||
    name === "卵" ||
    type === "卵"
  ) {
    return [4, 6, 8, 10, 12].map(function(value) {
      return makeAmountCandidate(value, "個");
    });
  }

  if (
    name.includes("低脂肪乳") ||
    name.includes("無脂肪乳") ||
    name.includes("加工乳") ||
    name.includes("乳飲料") ||
    name.includes("ミルク") ||
    name.includes("牛乳") ||
    type === "牛乳"
  ) {
    return [250, 500, 1000].map(function(value) {
      return makeAmountCandidate(value, "ml");
    });
  }

  if (
    name.includes("飲むヨーグルト") ||
    name.includes("のむヨーグルト") ||
    name.includes("ギリシャヨーグルト") ||
    name.includes("プレーンヨーグルト") ||
    name.includes("ヨーグルト") ||
    type === "ヨーグルト"
  ) {
    return [
      makeAmountCandidate(1, "個"),
      makeAmountCandidate(3, "個"),
      makeAmountCandidate(4, "個"),
      makeAmountCandidate(400, "g"),
      makeAmountCandidate(500, "g")
    ];
  }

  if (
    name.includes("スライスチーズ") ||
    name.includes("とろけるチーズ") ||
    name.includes("ピザ用チーズ") ||
    name.includes("粉チーズ") ||
    name.includes("クリームチーズ") ||
    name.includes("カッテージチーズ") ||
    name.includes("モッツァレラ") ||
    name.includes("カマンベール") ||
    name.includes("チーズ") ||
    type === "チーズ"
  ) {
    return [
      makeAmountCandidate(1, "袋"),
      makeAmountCandidate(1, "パック"),
      makeAmountCandidate(6, "枚"),
      makeAmountCandidate(10, "枚"),
      makeAmountCandidate(200, "g")
    ];
  }

  if (
    name.includes("無塩バター") ||
    name.includes("有塩バター") ||
    name.includes("発酵バター") ||
    name.includes("マーガリン") ||
    name.includes("バター") ||
    type === "バター"
  ) {
    return [100, 150, 200, 450].map(function(value) {
      return makeAmountCandidate(value, "g");
    });
  }

  if (
    name.includes("ホイップクリーム") ||
    name.includes("ホイップ") ||
    name.includes("生クリーム") ||
    type === "生クリーム"
  ) {
    return [100, 200, 500].map(function(value) {
      return makeAmountCandidate(value, "ml");
    });
  }

  if (
    name.includes("練乳") ||
    name.includes("コンデンスミルク") ||
    (category === "卵・乳製品" && type === "その他")
  ) {
    return [
      makeAmountCandidate(1, "本"),
      makeAmountCandidate(120, "g"),
      makeAmountCandidate(180, "g")
    ];
  }

  // 冷凍食品：種類ごとに、購入時に自然な販売単位を表示する。
  if (category === "冷凍食品") {
    if (type === "調理用の冷凍肉・魚") {
      return [
        makeAmountCandidate(100, "g"),
        makeAmountCandidate(200, "g"),
        makeAmountCandidate(300, "g"),
        makeAmountCandidate(500, "g"),
        makeAmountCandidate(1, "kg")
      ];
    }

    if (type === "スイーツ系") {
      return [1, 2, 3].map(function(value) {
        return makeAmountCandidate(value, "個");
      });
    }

    if (
      type === "お弁当・おかず系" ||
      type === "主食系" ||
      type === "冷凍野菜・カット野菜"
    ) {
      return [1, 2].map(function(value) {
        return makeAmountCandidate(value, "袋");
      });
    }

    return [1, 2].map(function(value) {
      return makeAmountCandidate(value, "袋");
    });
  }

  // 加工食品：スーパーで購入した販売単位を優先する。
  if (category === "加工食品") {
    if (type === "缶詰・瓶詰") {
      if (
        name.includes("ツナ缶（3缶）") || name.includes("ツナ缶(3缶)") ||
        name.includes("ツナ缶（4缶）") || name.includes("ツナ缶(4缶)") ||
        name.includes("3缶") || name.includes("4缶")
      ) {
        return [1, 2].map(function(value) {
          return makeAmountCandidate(value, "パック");
        });
      }
      return [1, 2, 3, 5].map(function(value) {
        return makeAmountCandidate(value, "個");
      });
    }

    if (type === "レトルト") {
      return [1, 2, 3, 5].map(function(value) {
        return makeAmountCandidate(value, "個");
      });
    }

    if (type === "加工肉") {
      if (name.includes("3連ハム") || name.includes("三連ハム")) {
        return [
          makeAmountCandidate(1, "束", "1束（3連）"),
          makeAmountCandidate(2, "束", "2束（3連）")
        ];
      }
      if (name.includes("ウインナー") || name.includes("ウィンナー") || name.includes("ソーセージ")) {
        return [1, 2].map(function(value) {
          return makeAmountCandidate(value, "袋");
        });
      }
      return [1, 2].map(function(value) {
        return makeAmountCandidate(value, "パック");
      });
    }

    if (type === "練り物") {
      return [1, 2].map(function(value) {
        return makeAmountCandidate(value, "パック");
      });
    }

    if (type === "大豆食品") {
      if (name.includes("ミニ豆腐")) {
        return [
          makeAmountCandidate(1, "パック", "1パック（4個入り）"),
          makeAmountCandidate(2, "パック", "2パック（4個入り）")
        ];
      }
      if (name.includes("木綿豆腐") || name.includes("絹ごし豆腐") || name.includes("絹豆腐") || name === "豆腐") {
        return [1, 2].map(function(value) {
          return makeAmountCandidate(value, "丁");
        });
      }
      if (name.includes("納豆")) {
        return [
          makeAmountCandidate(1, "パック", "1パック（3個入り）"),
          makeAmountCandidate(2, "パック", "2パック（3個入り）"),
          makeAmountCandidate(3, "パック", "3パック（3個入り）")
        ];
      }
      if (name.includes("こんにゃく") || name.includes("蒟蒻")) {
        return [1, 2].map(function(value) {
          return makeAmountCandidate(value, "袋");
        });
      }
      return [1, 2].map(function(value) {
        return makeAmountCandidate(value, "パック");
      });
    }

    if (type === "漬物") {
      return [1, 2].map(function(value) {
        return makeAmountCandidate(value, "パック");
      });
    }

    return [1, 2].map(function(value) {
      return makeAmountCandidate(value, "個");
    });
  }

  // 野菜：実際のスーパーでよく見る販売形態を優先する。
  if (category === "野菜") {
    // バラ売りと袋売りの両方をよく見かける4品。
    if (name.includes("玉ねぎ") || name.includes("玉葱")) {
      return [
        makeAmountCandidate(1, "個"),
        makeAmountCandidate(2, "個"),
        makeAmountCandidate(3, "個"),
        makeAmountCandidate(5, "個"),
        makeAmountCandidate(1, "袋")
      ];
    }

    if (name.includes("にんじん") || name.includes("人参")) {
      return [
        makeAmountCandidate(1, "本"),
        makeAmountCandidate(2, "本"),
        makeAmountCandidate(3, "本"),
        makeAmountCandidate(1, "袋")
      ];
    }

    if (name.includes("ピーマン")) {
      return [
        makeAmountCandidate(1, "個"),
        makeAmountCandidate(3, "個"),
        makeAmountCandidate(5, "個"),
        makeAmountCandidate(1, "袋")
      ];
    }

    if (name.includes("パプリカ")) {
      return [
        makeAmountCandidate(1, "個"),
        makeAmountCandidate(2, "個"),
        makeAmountCandidate(1, "袋")
      ];
    }

    // きのこ類はパック販売を基本とする。
    if (
      type === "きのこ" ||
      name.includes("しめじ") ||
      name.includes("しいたけ") ||
      name.includes("椎茸") ||
      name.includes("えのき") ||
      name.includes("まいたけ") ||
      name.includes("舞茸") ||
      name.includes("エリンギ") ||
      name.includes("なめこ") ||
      name.includes("マッシュルーム") ||
      name.includes("きくらげ")
    ) {
      return [1, 2, 3].map(function(value) {
        return makeAmountCandidate(value, "パック");
      });
    }

    // 葉物・豆類・オクラなど、袋またはパックで売られることが多いもの。
    if (
      type === "葉物" ||
      type === "豆類" ||
      name.includes("もやし") ||
      name.includes("オクラ") ||
      name.includes("モロヘイヤ")
    ) {
      return [1, 2, 3].map(function(value) {
        return makeAmountCandidate(value, "袋");
      });
    }

    // 長ねぎ・アスパラ・とうもろこしなど、本数で管理しやすいもの。
    if (
      name.includes("長ねぎ") ||
      name.includes("長ネギ") ||
      name.includes("アスパラ") ||
      name.includes("とうもろこし") ||
      name.includes("トウモロコシ") ||
      name.includes("ごぼう") ||
      name.includes("ゴボウ") ||
      name.includes("さつまいも") ||
      name.includes("サツマイモ")
    ) {
      return [1, 2, 3, 5].map(function(value) {
        return makeAmountCandidate(value, "本");
      });
    }

    // 大葉や香味野菜は束・パックの両方を用意する。
    if (
      type === "香味野菜" ||
      name.includes("大葉") ||
      name.includes("しそ") ||
      name.includes("シソ") ||
      name.includes("パセリ") ||
      name.includes("パクチー") ||
      name.includes("みょうが")
    ) {
      return [
        makeAmountCandidate(1, "束"),
        makeAmountCandidate(2, "束"),
        makeAmountCandidate(1, "パック"),
        makeAmountCandidate(2, "パック")
      ];
    }

    // その他の一般的な野菜は個数管理を基本とする。
    return [1, 2, 3, 4, 5].map(function(value) {
      return makeAmountCandidate(value, "個");
    });
  }

  // 果物：個・本・房・パック・玉を商品ごとに使い分ける。
  if (category === "果物") {
    if (name.includes("バナナ") || type === "バナナ") {
      return [
        makeAmountCandidate(1, "本"),
        makeAmountCandidate(2, "本"),
        makeAmountCandidate(3, "本"),
        makeAmountCandidate(1, "房"),
        makeAmountCandidate(2, "房")
      ];
    }

    if (name.includes("ぶどう") || name.includes("ブドウ") || name.includes("葡萄") || type === "ぶどう") {
      return [1, 2, 3].map(function(value) {
        return makeAmountCandidate(value, "房");
      });
    }

    if (
      name.includes("いちご") || name.includes("イチゴ") || name.includes("苺") ||
      name.includes("ブルーベリー") || name.includes("ラズベリー") ||
      name.includes("ブラックベリー") || name.includes("さくらんぼ") ||
      name.includes("チェリー") || name.includes("びわ") || name.includes("枇杷") ||
      name.includes("いちじく") || name.includes("無花果") ||
      name.includes("すもも") || name.includes("プラム") || name.includes("プルーン") ||
      type === "いちご" || type === "さくらんぼ" || type === "ブルーベリー"
    ) {
      return [1, 2, 3].map(function(value) {
        return makeAmountCandidate(value, "パック");
      });
    }

    if (name.includes("スイカ") || name.includes("すいか") || type === "スイカ") {
      return [
        makeAmountCandidate(1, "玉"),
        makeAmountCandidate(0.5, "玉"),
        makeAmountCandidate(0.25, "玉")
      ];
    }

    if (name.includes("栗") || name.includes("くり") || type === "栗") {
      return [1, 2, 3].map(function(value) {
        return makeAmountCandidate(value, "袋");
      });
    }

    // りんご、梨、桃、柑橘、メロンなどは個数管理。
    return [1, 2, 3, 4, 5].map(function(value) {
      return makeAmountCandidate(value, "個");
    });
  }

  // 肉：通常は重量管理。ステーキなど枚数で買う商品だけ専用候補を優先する。
  if (category === "肉") {
    if (
      name.includes("ステーキ") ||
      name.includes("とんかつ用") ||
      name.includes("ポークソテー用") ||
      name.includes("しょうが焼き用")
    ) {
      return [1, 2, 3, 4].map(function(value) {
        return makeAmountCandidate(value, "枚");
      });
    }

    return [100, 200, 300, 500].map(function(value) {
      return makeAmountCandidate(value, "g");
    });
  }

  // 魚：販売形態に合わせて、パック・切れ・尾・重量を使い分ける。
  if (category === "魚") {
    // 刺身・ネギトロなどはパック管理。
    if (
      name.includes("刺身") ||
      name.includes("お刺身") ||
      name.includes("ネギトロ") ||
      name.includes("ねぎとろ") ||
      name.includes("たたき") ||
      type === "刺身"
    ) {
      return [1, 2, 3].map(function(value) {
        return makeAmountCandidate(value, "パック");
      });
    }

    // 切り身として売られることが多い魚。
    if (
      name.includes("切り身") ||
      name.includes("鮭") ||
      name.includes("しゃけ") ||
      name.includes("サーモン") ||
      name.includes("塩サバ") ||
      name.includes("塩さば") ||
      name.includes("ブリ") ||
      name.includes("ぶり") ||
      name.includes("タラ") ||
      name.includes("たら") ||
      name.includes("鱈") ||
      type === "鮭" ||
      type === "ブリ" ||
      type === "タラ"
    ) {
      return [1, 2, 3, 4].map(function(value) {
        return makeAmountCandidate(value, "切れ");
      });
    }

    // 丸魚として買うことが多い魚。
    if (
      name.includes("アジ") ||
      name.includes("あじ") ||
      name.includes("鯵") ||
      name.includes("イワシ") ||
      name.includes("いわし") ||
      name.includes("鰯") ||
      name.includes("サンマ") ||
      name.includes("さんま") ||
      name.includes("秋刀魚") ||
      name.includes("ホッケ") ||
      name.includes("ほっけ") ||
      type === "アジ" ||
      type === "イワシ" ||
      type === "サンマ"
    ) {
      return [1, 2, 3, 4].map(function(value) {
        return makeAmountCandidate(value, "尾");
      });
    }

    // エビ・イカ・タコ・貝類などは重量またはパックで管理。
    if (
      type === "エビ" ||
      type === "カニ" ||
      type === "イカ" ||
      type === "タコ" ||
      type === "貝類" ||
      name.includes("エビ") ||
      name.includes("えび") ||
      name.includes("海老") ||
      name.includes("イカ") ||
      name.includes("いか") ||
      name.includes("タコ") ||
      name.includes("たこ") ||
      name.includes("ホタテ") ||
      name.includes("あさり") ||
      name.includes("しじみ") ||
      name.includes("牡蠣")
    ) {
      return [
        makeAmountCandidate(1, "パック"),
        makeAmountCandidate(100, "g"),
        makeAmountCandidate(200, "g"),
        makeAmountCandidate(300, "g")
      ];
    }

    // 専用判定に当てはまらない魚は重量管理を基本とする。
    return [100, 200, 300, 500].map(function(value) {
      return makeAmountCandidate(value, "g");
    });
  }

  return [];
}

function getLearnedAmountCandidate() {
  if (!foodLearningEnabled) return null;
  const bucket = foodPreferences[getFoodPreferenceKey()];
  const value = bucket ? getMostUsedValue(bucket.amounts) : "";
  if (!value) return null;
  const parts = value.split("|");
  return { amount: parts[0], unit: parts.slice(1).join("|"), label: parts[0] + parts.slice(1).join("|"), learned: true };
}

function renderAmountSuggestions() {
  const area = document.getElementById("amountSuggestionArea");
  const container = document.getElementById("amountSuggestionButtons");
  if (!area || !container) return;

  const candidates = getBaseAmountCandidates();
  const learned = getLearnedAmountCandidate();
  const combined = [];
  if (learned) combined.push(learned);
  candidates.forEach(function(candidate) {
    if (!combined.some(function(item) { return item.amount === candidate.amount && item.unit === candidate.unit; })) {
      combined.push(candidate);
    }
  });

  const visible = combined.slice(0, 5);
  area.style.display = visible.length ? "block" : "none";
  container.innerHTML = visible.map(function(candidate) {
    const learnedClass = candidate.learned ? " learned" : "";
    const star = candidate.learned ? "⭐ " : "";
    return '<button class="suggestion-button' + learnedClass + '" type="button" onclick="applyAmountSuggestion(\'' +
      escapeForAttribute(candidate.amount) + '\',\'' + escapeForAttribute(candidate.unit) + '\')">' +
      star + escapeHtml(candidate.label) + '</button>';
  }).join("");
}

function applyAmountSuggestion(amount, unit) {
  document.getElementById("foodAmount").value = amount;
  document.getElementById("foodUnit").value = unit;
  foodUnitManuallyChanged = true;
}

function getBaseExpiryCandidates() {
  const category = document.getElementById("foodCategory").value;
  const type = document.getElementById("foodType").value;
  if (category === "肉" || category === "魚") return [0, 1, 3];
  if (category === "冷凍食品") return [7, 30, 90];
  if (type === "牛乳" || type === "ヨーグルト" || category === "卵・乳製品") return [3, 7, 14];
  if (category === "飲み物" || category === "調味料") return [7, 30, 90];
  return [0, 1, 3, 7];
}

function formatExpiryCandidate(days) {
  if (days === 0) return "今日";
  if (days === 1) return "明日";
  if (days === 7) return "1週間後";
  if (days === 14) return "2週間後";
  if (days === 30) return "1か月後";
  if (days === 90) return "3か月後";
  return days + "日後";
}

function getLearnedExpiryDays() {
  if (!foodLearningEnabled) return null;
  const bucket = foodPreferences[getFoodPreferenceKey()];
  const value = bucket ? getMostUsedValue(bucket.expiryDays) : "";
  return value === "" ? null : Number(value);
}

function renderExpirySuggestions() {
  const container = document.getElementById("expirySuggestionButtons");
  if (!container) return;
  const learned = getLearnedExpiryDays();
  const days = [];
  if (learned !== null && Number.isFinite(learned)) days.push({ days: learned, learned: true });
  getBaseExpiryCandidates().forEach(function(value) {
    if (!days.some(function(item) { return item.days === value; })) days.push({ days: value, learned: false });
  });
  container.innerHTML = days.slice(0, 4).map(function(item) {
    return '<button class="quick-date-button' + (item.learned ? ' learned' : '') + '" type="button" onclick="setExpiryFromToday(' + item.days + ')">' +
      (item.learned ? '⭐ ' : '') + escapeHtml(formatExpiryCandidate(item.days)) + '</button>';
  }).join("");
}

function renderFoodInputSuggestions() {
  renderDrinkVariantSuggestions();
  renderAmountSuggestions();
  renderExpirySuggestions();
}

function setExpiryFromToday(daysToAdd) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + Number(daysToAdd || 0));
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  document.getElementById("foodExpiry").value = year + "-" + month + "-" + day;
}

function populateFoodSuggestions() {
  const list = document.getElementById("foodSuggestions");
  if (!list) return;
  const names = new Set();
  foodDatabaseGroups.forEach(function(group) {
    Object.keys(group.data).forEach(function(name) { names.add(name); });
  });
  list.innerHTML = Array.from(names)
    .sort(function(a, b) { return a.localeCompare(b, "ja"); })
    .map(function(name) { return '<option value="' + escapeHtml(name) + '"></option>'; })
    .join("");
}

    function escapeHtml(value) {
      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function escapeForAttribute(value) {
      return String(value ?? "")
        .replaceAll("\\", "\\\\")
        .replaceAll("'", "\\'");
    }

    function showToast(message) {
      const toast = document.getElementById("toast");
      freezeUndoAction = null;
      toast.innerHTML = '<span>' + escapeHtml(message) + '</span>';
      toast.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function() {
        toast.classList.remove("show");
      }, 2200);
    }

    function showUndoToast(message, undoAction) {
      const toast = document.getElementById("toast");
      freezeUndoAction = undoAction;
      toast.innerHTML = '<span>' + escapeHtml(message) + '</span>' +
        '<button class="toast-action-button" type="button" onclick="runFreezeUndo()">取り消す</button>';
      toast.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function() {
        freezeUndoAction = null;
        toast.classList.remove("show");
      }, 6000);
    }

    function runFreezeUndo() {
      if (typeof freezeUndoAction !== "function") return;
      const action = freezeUndoAction;
      freezeUndoAction = null;
      action();
      document.getElementById("toast").classList.remove("show");
      showToast("小分け（冷凍）を取り消しました");
    }

    function getFreezerKind(food) {
      if (food.freezerKind === "self" || food.freezerKind === "commercial") {
        return food.freezerKind;
      }
      return food.category === "冷凍食品" ? "commercial" : "self";
    }

    function getFrozenDate(food) {
      return food.frozenAt || "";
    }

    function syncFreezerSortControl() {
      const select = document.getElementById("freezerSort");
      if (select) select.value = freezerSort;
    }

    function changeFreezerSort() {
      const select = document.getElementById("freezerSort");
      freezerSort = select ? select.value : "expiry";
      localStorage.setItem(FREEZER_SORT_STORAGE_KEY, freezerSort);
      renderFreezer();
    }

    function getFreezerCategoryOrder(categories) {
      const saved = Array.isArray(freezerOrder.categories) ? freezerOrder.categories.slice() : [];
      categories.forEach(function(category) {
        if (!saved.includes(category)) saved.push(category);
      });
      return saved.filter(function(category) { return categories.includes(category); });
    }

    function getFreezerItemOrder(category, items) {
      const all = freezerOrder.items && typeof freezerOrder.items === "object" ? freezerOrder.items : {};
      const saved = Array.isArray(all[category]) ? all[category].map(String) : [];
      items.forEach(function(item) {
        if (!saved.includes(String(item.id))) saved.push(String(item.id));
      });
      return saved.filter(function(id) {
        return items.some(function(item) { return String(item.id) === String(id); });
      });
    }

    function saveFreezerOrder() {
      writeStorage(FREEZER_ORDER_STORAGE_KEY, freezerOrder);
    }

    function renderFreezer() {
      const list = document.getElementById("freezerList");
      if (!list) return;
      const search = document.getElementById("freezerSearch");
      const searchText = search ? search.value.trim().toLowerCase() : "";
      const frozenFoods = foods.filter(function(food) {
        return food.location === "冷凍" && (!searchText || String(food.name || "").toLowerCase().includes(searchText));
      });

      if (frozenFoods.length === 0) {
        list.innerHTML = createEmptyHtml(searchText ? "条件に一致する冷凍食品がありません。" : "冷凍庫に食品はありません。");
        return;
      }

      const categoryMap = {};
      frozenFoods.forEach(function(food) {
        const category = food.category || "その他";
        if (!categoryMap[category]) categoryMap[category] = [];
        categoryMap[category].push(food);
      });
      let categories = Object.keys(categoryMap);

      if (freezerSort === "manual") {
        categories = getFreezerCategoryOrder(categories);
      } else {
        categories.sort(function(a, b) { return a.localeCompare(b, "ja"); });
      }

      list.innerHTML = categories.map(function(category, categoryIndex) {
        let items = categoryMap[category].slice();
        if (freezerSort === "name") {
          items.sort(function(a, b) { return String(a.name).localeCompare(String(b.name), "ja"); });
        } else if (freezerSort === "manual") {
          const ids = getFreezerItemOrder(category, items);
          items.sort(function(a, b) { return ids.indexOf(String(a.id)) - ids.indexOf(String(b.id)); });
        } else {
          items.sort(function(a, b) {
            const aSelf = getFreezerKind(a) === "self";
            const bSelf = getFreezerKind(b) === "self";
            if (aSelf && bSelf) return String(getFrozenDate(a)).localeCompare(String(getFrozenDate(b)));
            if (!aSelf && !bSelf) return String(a.expiry || "9999-12-31").localeCompare(String(b.expiry || "9999-12-31"));
            return aSelf ? 1 : -1;
          });
        }

        const categoryActions = freezerSort === "manual"
          ? '<div class="freezer-manual-actions">' +
            '<button class="freezer-order-button" type="button" onclick="moveFreezerCategory(' + categoryIndex + ',-1)">↑</button>' +
            '<button class="freezer-order-button" type="button" onclick="moveFreezerCategory(' + categoryIndex + ',1)">↓</button>' +
            '</div>'
          : '';

        return '<section class="freezer-category">' +
          '<div class="freezer-category-header"><h3>' + escapeHtml(getCategoryDisplayName(category)) + '</h3>' +
          categoryActions + '</div>' +
          items.map(function(food, itemIndex) { return createFreezerItemHtml(food, category, itemIndex); }).join('') +
          '</section>';
      }).join('');
    }

    function createFreezerItemHtml(food, category, itemIndex) {
      const selfFrozen = getFreezerKind(food) === "self";
      const dateLabel = selfFrozen
        ? '冷凍した日：' + escapeHtml(getFrozenDate(food) || "未設定")
        : '賞味期限：' + escapeHtml(food.expiry || "未入力");
      const status = selfFrozen ? { className: "safe", text: "自家冷凍" } : getFoodStatus(getDaysLeft(food.expiry));
      const orderActions = freezerSort === "manual"
        ? '<div class="freezer-manual-actions">' +
          '<button class="freezer-order-button" type="button" onclick="moveFreezerItem(\'' + escapeForAttribute(category) + '\',' + itemIndex + ',-1)">↑</button>' +
          '<button class="freezer-order-button" type="button" onclick="moveFreezerItem(\'' + escapeForAttribute(category) + '\',' + itemIndex + ',1)">↓</button>' +
          '</div>'
        : '';
      return '<div class="freezer-item-wrap">' +
        '<article class="food-item ' + status.className + '">' +
        '<div class="food-heading"><h3 class="food-name">' + escapeHtml(food.name) + '</h3>' +
        '<span class="status-badge ' + status.className + '">' + escapeHtml(status.text) + '</span></div>' +
        '<div class="freezer-item-meta"><span class="freezer-kind-badge">' + (selfFrozen ? '自家冷凍' : '市販冷凍') + '</span>' +
        escapeHtml(createAmountText(food)) + '<br>' + dateLabel + '</div>' +
        (freezerSort === "manual" ? orderActions : '<div class="item-actions"><button class="small-button" type="button" onclick="editFood(' + food.id + ')">編集</button><button class="small-button" type="button" onclick="toggleShoppingItem(' + food.id + ')">' + (Boolean(food.shopping || food.buyNext) ? '✅🛒' : '🛒') + '</button></div>') +
        '</article></div>';
    }

    function moveFreezerCategory(index, delta) {
      const frozenFoods = foods.filter(function(food) { return food.location === "冷凍"; });
      const categories = getFreezerCategoryOrder(Array.from(new Set(frozenFoods.map(function(food) { return food.category || "その他"; }))));
      const target = index + delta;
      if (target < 0 || target >= categories.length) return;
      const temp = categories[index]; categories[index] = categories[target]; categories[target] = temp;
      freezerOrder.categories = categories;
      saveFreezerOrder();
      renderFreezer();
    }

    function moveFreezerItem(category, index, delta) {
      const items = foods.filter(function(food) { return food.location === "冷凍" && (food.category || "その他") === category; });
      const ids = getFreezerItemOrder(category, items);
      const target = index + delta;
      if (target < 0 || target >= ids.length) return;
      const temp = ids[index]; ids[index] = ids[target]; ids[target] = temp;
      if (!freezerOrder.items || typeof freezerOrder.items !== "object") freezerOrder.items = {};
      freezerOrder.items[category] = ids;
      saveFreezerOrder();
      renderFreezer();
    }

    function createFreezeSwipeFoodHtml(food) {
      if (food.location === "冷凍") return createFoodHtml(food, true);
      return '<div id="freezeSwipe-' + food.id + '" class="freeze-swipe-wrap" ontouchstart="startFreezeSwipe(event,' + food.id + ')" ontouchend="endFreezeSwipe(event,' + food.id + ')">' +
        '<button class="freeze-swipe-action" type="button" onclick="openFreezeSplitModal(' + food.id + ')">❄️ 小分け<br>（冷凍）</button>' +
        '<div class="freeze-swipe-card">' + createFoodHtml(food, true) + '</div></div>';
    }

    function startFreezeSwipe(event) {
      const touch = event.touches && event.touches[0];
      if (!touch) return;
      freezeSwipeStartX = touch.clientX;
      freezeSwipeStartY = touch.clientY;
    }

    function endFreezeSwipe(event, id) {
      const touch = event.changedTouches && event.changedTouches[0];
      if (!touch) return;
      const dx = touch.clientX - freezeSwipeStartX;
      const dy = touch.clientY - freezeSwipeStartY;
      const wrap = document.getElementById("freezeSwipe-" + id);
      if (!wrap || Math.abs(dy) > Math.abs(dx)) return;
      if (dx < -45) wrap.classList.add("swiped");
      if (dx > 35) wrap.classList.remove("swiped");
    }

    function openFreezeSplitModal(id) {
      const food = foods.find(function(item) { return item.id === id; });
      if (!food) return;
      if (!["g", "kg"].includes(food.unit) || !Number.isFinite(Number(food.amount)) || Number(food.amount) <= 0) {
        showToast("小分けはg・kgで数量登録された食材が対象です");
        return;
      }
      freezeSplitFoodId = id;
      freezeWheelDigits = [0, 0, 0];
      document.getElementById("freezeSplitFoodName").textContent = food.name + " から冷凍する量";
      renderFreezeWheel();
      const modal = document.getElementById("freezeSplitModal");
      modal.classList.add("show");
      modal.setAttribute("aria-hidden", "false");
    }

    function closeFreezeSplitModal() {
      freezeSplitFoodId = null;
      const modal = document.getElementById("freezeSplitModal");
      modal.classList.remove("show");
      modal.setAttribute("aria-hidden", "true");
    }

    function renderFreezeWheel() {
      const wheel = document.getElementById("freezeWheel");
      const labels = ["100", "10", "1"];
      wheel.innerHTML = labels.map(function(label, columnIndex) {
        let html = '<div class="freeze-wheel-column" data-column="' + columnIndex + '" onscroll="handleFreezeWheelScroll(this,' + columnIndex + ')"><div class="freeze-wheel-spacer"></div>';
        for (let cycle = 0; cycle < 5; cycle += 1) {
          for (let digit = 0; digit <= 9; digit += 1) {
            html += '<div class="freeze-wheel-option">' + digit + '</div>';
          }
        }
        html += '<div class="freeze-wheel-spacer"></div></div>';
        return html;
      }).join('');
      requestAnimationFrame(function() {
        wheel.querySelectorAll('.freeze-wheel-column').forEach(function(column) {
          column.scrollTop = 20 * 40;
        });
        updateFreezeWheelValue();
      });
    }

    function handleFreezeWheelScroll(column, columnIndex) {
      clearTimeout(column._freezeTimer);
      column._freezeTimer = setTimeout(function() {
        const rawIndex = Math.round(column.scrollTop / 40);
        const digit = ((rawIndex % 10) + 10) % 10;
        freezeWheelDigits[columnIndex] = digit;
        const centered = 20 + digit;
        if (Math.abs(rawIndex - centered) > 10) column.scrollTop = centered * 40;
        updateFreezeWheelValue();
      }, 70);
    }

    function updateFreezeWheelValue() {
      const value = freezeWheelDigits[0] * 100 + freezeWheelDigits[1] * 10 + freezeWheelDigits[2];
      document.getElementById("freezeWheelValue").textContent = String(value).padStart(3, "0") + "g";
    }

    function confirmFreezeSplit() {
      const food = foods.find(function(item) { return item.id === freezeSplitFoodId; });
      if (!food) return;
      const grams = freezeWheelDigits[0] * 100 + freezeWheelDigits[1] * 10 + freezeWheelDigits[2];
      if (grams < 1) {
        showToast("1g以上を選択してください");
        return;
      }
      const sourceGrams = food.unit === "kg" ? Number(food.amount) * 1000 : Number(food.amount);
      if (grams > sourceGrams) {
        showToast("登録数量を超える量は小分けできません");
        return;
      }

      const sourceSnapshot = JSON.parse(JSON.stringify(food));
      const remainingGrams = sourceGrams - grams;
      if (food.unit === "kg") {
        food.amount = String(Number((remainingGrams / 1000).toFixed(3)));
      } else {
        food.amount = String(remainingGrams);
      }
      food.updatedAt = new Date().toISOString();

      const newId = Date.now();
      const frozenFood = {
        id: newId,
        name: food.name,
        category: food.category,
        type: food.type || "",
        location: "冷凍",
        amount: String(grams),
        unit: "g",
        capacity: "",
        drinkVariantLearningKey: "",
        expiry: "",
        purchaseDate: "",
        note: "",
        freezerKind: "self",
        frozenAt: getTodayString(),
        shopping: false,
        buyNext: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      foods.push(frozenFood);
      saveFoods();
      closeFreezeSplitModal();
      renderStock();
      renderCategories();
      renderHome();
      renderFreezer();
      showUndoToast(food.name + "を" + grams + "g冷凍しました", function() {
        const index = foods.findIndex(function(item) { return item.id === sourceSnapshot.id; });
        if (index !== -1) foods[index] = sourceSnapshot;
        foods = foods.filter(function(item) { return item.id !== newId; });
        saveFoods();
        renderStock();
        renderCategories();
        renderHome();
        renderFreezer();
      });
    }

function createShoppingSeasoningHtml(item) {
    return (
      '<article class="food-item safe">' +
      '<div class="food-heading">' +
      '<h3 class="food-name">' + escapeHtml(item.name) + '</h3>' +
      '<span class="status-badge safe">調味料</span>' +
      '</div>' +
      '<div class="food-info">保存：' + escapeHtml(item.location || "未設定") +
      '<br>残量・数量：' + escapeHtml(item.amount || "未入力") + '</div>' +
      '<div class="item-actions">' +
      '<button class="small-button" type="button" onclick="toggleBuyNext(' + item.id + ')">✅🛒</button>' +
      '</div>' +
      '</article>'
    );
}

function renderShoppingList() {
    const shoppingList = document.getElementById("shoppingFoodList");
    if (!shoppingList) return;

    const shoppingFoods = foods.filter(function(food) {
        return Boolean(food.shopping || food.buyNext);
    });

    const shoppingSeasonings = seasonings.filter(function(item) {
        return Boolean(item.buyNext);
    });

    if (shoppingFoods.length === 0 && shoppingSeasonings.length === 0) {
        shoppingList.innerHTML = createEmptyHtml("次回購入はありません。");
        return;
    }

    let html = "";

    if (shoppingFoods.length > 0) {
      html += '<section class="category-block"><div class="category-heading"><h3>食材・飲み物</h3><span class="category-count">' + shoppingFoods.length + '件</span></div>';
      html += shoppingFoods.map(function(food) {
        return createFoodHtml(food, false, true);
      }).join("");
      html += '</section>';
    }

    if (shoppingSeasonings.length > 0) {
      html += '<section class="category-block"><div class="category-heading"><h3>調味料</h3><span class="category-count">' + shoppingSeasonings.length + '件</span></div>';
      html += shoppingSeasonings.map(createShoppingSeasoningHtml).join("");
      html += '</section>';
    }

    shoppingList.innerHTML = html;
}

function showShoppingList() {
    showScreen("shoppingScreen");

}
    populateFoodSuggestions();
    setDefaultUnitByCategory(true);
    syncFoodLearningToggle();
    renderFoodInputSuggestions();
    renderHome();
  
