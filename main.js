import './style.css'

class SalesSystem {
  constructor() {
    this.data = JSON.parse(localStorage.getItem('salesData') || '{}')
    this.isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
    this.theme = localStorage.getItem('theme') || 'light'
    this.currentDay = new Date().toLocaleDateString('pt-BR')

    this.init()
  }

  init() {
    this.ensureTodayExists()
    this.applyTheme()

    if (this.isLoggedIn) {
      this.renderApp()
    } else {
      this.renderLogin()
    }
  }

  ensureTodayExists() {
    if (!this.data[this.currentDay]) {
      this.data[this.currentDay] = []
      this.saveData()
    }
  }

  saveData() {
    localStorage.setItem('salesData', JSON.stringify(this.data))
  }

  applyTheme() {
    document.body.className = this.theme === 'dark' ? 'dark' : ''
  }

  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light'
    localStorage.setItem('theme', this.theme)
    this.applyTheme()
  }

  renderLogin() {
    const app = document.querySelector('#app')
    app.innerHTML = `
      <div class="login-container">
        <div class="box">
          <div class="login-icon">🔐</div>
          <h3 style="text-align: center; border: none; padding: 0;">Sistema de Vendas</h3>
          <p style="text-align: center; color: var(--neutral-600); margin-bottom: 24px;">Entre com sua senha para acessar</p>
          <input
            id="password"
            type="password"
            placeholder="Digite sua senha"
            autocomplete="current-password"
          />
          <button id="loginBtn">Entrar</button>
        </div>
      </div>
    `

    const passwordInput = document.getElementById('password')
    const loginBtn = document.getElementById('loginBtn')

    const handleLogin = () => {
      const password = passwordInput.value
      if (password === '1234') {
        this.isLoggedIn = true
        localStorage.setItem('isLoggedIn', 'true')
        this.renderApp()
      } else {
        passwordInput.value = ''
        passwordInput.style.borderColor = 'var(--error-500)'
        passwordInput.placeholder = 'Senha incorreta! Tente novamente'

        setTimeout(() => {
          passwordInput.style.borderColor = ''
          passwordInput.placeholder = 'Digite sua senha'
        }, 2000)
      }
    }

    loginBtn.addEventListener('click', handleLogin)
    passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleLogin()
    })
  }

  renderApp() {
    const app = document.querySelector('#app')
    app.innerHTML = `
      <div class="header">
        <h1>Sistema de Vendas Profissional</h1>
        <button class="theme-toggle" id="themeToggle">
          <span>${this.theme === 'light' ? '🌙' : '☀️'}</span>
          <span>${this.theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</span>
        </button>
      </div>

      <div class="box">
        <h3>Registrar Venda</h3>
        <input id="productName" placeholder="Nome do produto" />
        <div class="input-group">
          <input id="costPrice" type="number" step="0.01" placeholder="Preço de compra (R$)" />
          <input id="salePrice" type="number" step="0.01" placeholder="Preço de venda (R$)" />
        </div>
        <input id="quantity" type="number" min="1" placeholder="Quantidade" />
        <button id="addSaleBtn">Adicionar Venda</button>
      </div>

      <div class="box">
        <h3>Vendas Registradas</h3>
        <select id="daySelect"></select>
        <div id="salesList" class="sales-list"></div>
      </div>

      <div class="box">
        <h3>Resumo Financeiro</h3>
        <div id="summary" class="summary-grid"></div>
        <div class="button-group">
          <button id="exportBtn" class="secondary">Exportar Relatório</button>
          <button id="resetBtn" class="danger">Resetar Dia</button>
        </div>
      </div>

      <div class="box">
        <h3>Análise Visual</h3>
        <div class="charts-grid">
          <div id="chart1" class="chart-container"></div>
          <div id="chart2" class="chart-container"></div>
        </div>
      </div>
    `

    this.attachEventListeners()
    this.loadDayOptions()
    this.loadDayData()
  }

  attachEventListeners() {
    document.getElementById('themeToggle').addEventListener('click', () => {
      this.toggleTheme()
      this.renderApp()
    })

    document.getElementById('addSaleBtn').addEventListener('click', () => {
      this.addSale()
    })

    document.getElementById('daySelect').addEventListener('change', () => {
      this.currentDay = document.getElementById('daySelect').value
      this.loadDayData()
    })

    document.getElementById('resetBtn').addEventListener('click', () => {
      this.resetDay()
    })

    document.getElementById('exportBtn').addEventListener('click', () => {
      this.exportReport()
    })

    const inputs = ['productName', 'costPrice', 'salePrice', 'quantity']
    inputs.forEach(id => {
      document.getElementById(id).addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.addSale()
      })
    })
  }

  loadDayOptions() {
    const select = document.getElementById('daySelect')
    select.innerHTML = ''

    const sortedDays = Object.keys(this.data).sort((a, b) => {
      const dateA = a.split('/').reverse().join('')
      const dateB = b.split('/').reverse().join('')
      return dateB.localeCompare(dateA)
    })

    sortedDays.forEach(day => {
      const option = document.createElement('option')
      option.value = day
      option.textContent = day === this.currentDay ? `${day} (Hoje)` : day
      select.appendChild(option)
    })

    select.value = this.currentDay
  }

  addSale() {
    const productName = document.getElementById('productName').value.trim()
    const costPrice = parseFloat(document.getElementById('costPrice').value)
    const salePrice = parseFloat(document.getElementById('salePrice').value)
    const quantity = parseInt(document.getElementById('quantity').value)

    if (!productName || isNaN(costPrice) || isNaN(salePrice) || isNaN(quantity) || quantity < 1) {
      this.showNotification('Preencha todos os campos corretamente', 'error')
      return
    }

    if (salePrice < costPrice) {
      if (!confirm('O preço de venda é menor que o de compra. Continuar?')) {
        return
      }
    }

    this.data[this.currentDay].push({
      productName,
      costPrice,
      salePrice,
      quantity,
      timestamp: new Date().toISOString()
    })

    this.saveData()
    this.loadDayData()
    this.clearForm()
    this.showNotification('Venda registrada com sucesso!', 'success')
  }

  clearForm() {
    document.getElementById('productName').value = ''
    document.getElementById('costPrice').value = ''
    document.getElementById('salePrice').value = ''
    document.getElementById('quantity').value = ''
    document.getElementById('productName').focus()
  }

  loadDayData() {
    const sales = this.data[this.currentDay] || []
    this.renderSalesList(sales)
    this.renderSummary(sales)
    this.renderCharts(sales)
  }

  renderSalesList(sales) {
    const list = document.getElementById('salesList')

    if (sales.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📦</div>
          <p>Nenhuma venda registrada neste dia</p>
        </div>
      `
      return
    }

    list.innerHTML = sales.map((sale, index) => {
      const totalSale = sale.salePrice * sale.quantity
      const totalCost = sale.costPrice * sale.quantity
      const profit = totalSale - totalCost
      const profitColor = profit >= 0 ? 'var(--success-600)' : 'var(--error-600)'

      return `
        <div class="sale-item">
          <div class="sale-info">
            <div class="sale-name">${sale.productName}</div>
            <div class="sale-details">
              Qtd: ${sale.quantity} |
              Custo: R$ ${sale.costPrice.toFixed(2)} |
              Venda: R$ ${sale.salePrice.toFixed(2)} |
              <span style="color: ${profitColor}; font-weight: 600;">
                Lucro: R$ ${profit.toFixed(2)}
              </span>
            </div>
          </div>
          <div class="sale-value">R$ ${totalSale.toFixed(2)}</div>
        </div>
      `
    }).join('')
  }

  renderSummary(sales) {
    let totalRevenue = 0
    let totalCost = 0
    let totalProfit = 0

    sales.forEach(sale => {
      const revenue = sale.salePrice * sale.quantity
      const cost = sale.costPrice * sale.quantity
      totalRevenue += revenue
      totalCost += cost
      totalProfit += (revenue - cost)
    })

    const margin = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0

    const summary = document.getElementById('summary')
    summary.innerHTML = `
      <div class="summary-card">
        <div class="summary-label">Total Vendido</div>
        <div class="summary-value">R$ ${totalRevenue.toFixed(2)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Total Investido</div>
        <div class="summary-value">R$ ${totalCost.toFixed(2)}</div>
      </div>
      <div class="summary-card profit">
        <div class="summary-label">Lucro Total</div>
        <div class="summary-value">R$ ${totalProfit.toFixed(2)}</div>
      </div>
      <div class="summary-card margin">
        <div class="summary-label">Margem</div>
        <div class="summary-value">${margin.toFixed(1)}%</div>
      </div>
    `
  }

  renderCharts(sales) {
    if (sales.length === 0) {
      document.getElementById('chart1').innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📊</div>
          <p>Adicione vendas para visualizar gráficos</p>
        </div>
      `
      document.getElementById('chart2').innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📈</div>
          <p>Adicione vendas para visualizar análises</p>
        </div>
      `
      return
    }

    let totalRevenue = 0
    let totalCost = 0
    let totalProfit = 0

    sales.forEach(sale => {
      const revenue = sale.salePrice * sale.quantity
      const cost = sale.costPrice * sale.quantity
      totalRevenue += revenue
      totalCost += cost
      totalProfit += (revenue - cost)
    })

    google.charts.load('current', { packages: ['corechart'] })

    google.charts.setOnLoadCallback(() => {
      const data1 = google.visualization.arrayToDataTable([
        ['Categoria', 'Valor'],
        ['Investimento', totalCost],
        ['Lucro', totalProfit]
      ])

      const options1 = {
        title: 'Distribuição: Investimento vs Lucro',
        pieHole: 0.4,
        colors: ['#0284c7', '#10b981'],
        backgroundColor: 'transparent',
        legend: { position: 'bottom' },
        chartArea: { width: '90%', height: '75%' }
      }

      const chart1 = new google.visualization.PieChart(document.getElementById('chart1'))
      chart1.draw(data1, options1)

      const data2 = google.visualization.arrayToDataTable([
        ['Métrica', 'Valor', { role: 'style' }],
        ['Vendido', totalRevenue, '#0284c7'],
        ['Custo', totalCost, '#ef4444'],
        ['Lucro', totalProfit, '#10b981']
      ])

      const options2 = {
        title: 'Visão Geral Financeira',
        backgroundColor: 'transparent',
        legend: { position: 'none' },
        chartArea: { width: '80%', height: '70%' },
        vAxis: { format: 'R$ #,##0.00' }
      }

      const chart2 = new google.visualization.ColumnChart(document.getElementById('chart2'))
      chart2.draw(data2, options2)
    })
  }

  resetDay() {
    if (!confirm(`Deseja realmente resetar todas as vendas do dia ${this.currentDay}?`)) {
      return
    }

    this.data[this.currentDay] = []
    this.saveData()
    this.loadDayData()
    this.showNotification('Vendas do dia resetadas', 'success')
  }

  exportReport() {
    const sales = this.data[this.currentDay] || []

    let totalRevenue = 0
    let totalCost = 0
    let totalProfit = 0

    let report = `RELATÓRIO DE VENDAS - ${this.currentDay}\n`
    report += `${'='.repeat(60)}\n\n`

    if (sales.length === 0) {
      report += 'Nenhuma venda registrada neste dia.\n'
    } else {
      report += 'VENDAS DETALHADAS:\n\n'

      sales.forEach((sale, index) => {
        const revenue = sale.salePrice * sale.quantity
        const cost = sale.costPrice * sale.quantity
        const profit = revenue - cost

        totalRevenue += revenue
        totalCost += cost
        totalProfit += profit

        report += `${index + 1}. ${sale.productName}\n`
        report += `   Quantidade: ${sale.quantity}\n`
        report += `   Preço de Compra: R$ ${sale.costPrice.toFixed(2)}\n`
        report += `   Preço de Venda: R$ ${sale.salePrice.toFixed(2)}\n`
        report += `   Total Vendido: R$ ${revenue.toFixed(2)}\n`
        report += `   Lucro: R$ ${profit.toFixed(2)}\n\n`
      })

      const margin = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0

      report += `${'='.repeat(60)}\n\n`
      report += 'RESUMO FINANCEIRO:\n\n'
      report += `Total Vendido: R$ ${totalRevenue.toFixed(2)}\n`
      report += `Total Investido: R$ ${totalCost.toFixed(2)}\n`
      report += `Lucro Total: R$ ${totalProfit.toFixed(2)}\n`
      report += `Margem de Lucro: ${margin.toFixed(1)}%\n`
    }

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio_vendas_${this.currentDay.replace(/\//g, '-')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    this.showNotification('Relatório exportado com sucesso!', 'success')
  }

  showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification')
    if (existing) existing.remove()

    const notification = document.createElement('div')
    notification.className = 'notification'
    notification.textContent = message

    const colors = {
      success: 'var(--success-500)',
      error: 'var(--error-500)',
      info: 'var(--primary-500)'
    }

    Object.assign(notification.style, {
      position: 'fixed',
      top: '24px',
      right: '24px',
      padding: '16px 24px',
      background: colors[type],
      color: 'white',
      borderRadius: '8px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
      zIndex: '10000',
      fontWeight: '600',
      animation: 'slideDown 0.3s ease',
      maxWidth: '400px'
    })

    document.body.appendChild(notification)

    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.3s ease'
      setTimeout(() => notification.remove(), 300)
    }, 3000)
  }
}

new SalesSystem()
