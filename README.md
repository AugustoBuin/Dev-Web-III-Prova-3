# Sistema de Reservas - Prova 3

Projeto completo em TypeScript + Express + MongoDB (Mongoose).  
Frontend simples em HTML/CSS/JS.

## Requisitos
- Node 18+
- MongoDB (local ou Atlas)

## Instalação
1. `git clone <repo>`
2. `cd reserva-de-mesas`
3. `npm install`
4. `npm run seed` (popula mesas iniciais)
5. `npm run dev`
6. Abra `http://localhost:3000`

## Endpoints principais
- `GET /mesas` — listar mesas
- `POST /mesas` — criar mesa
- `GET /reservas` — listar reservas (filtros via query: cliente, mesa, status, data)
- `POST /reservas` — criar reserva
- `PUT /reservas/:id` — atualizar reserva
- `DELETE /reservas/:id` — cancelar reserva

## Regras importantes implementadas
- Antecedência mínima de 1 hora para criar/atualizar reserva.
- Duração padrão: 90 minutos (configurável via `.env`).
- Não permite duas reservas sobrepostas na mesma mesa (status != cancelado).
- Validação de capacidade da mesa.
- Mapa visual no frontend com cores:
  - Verde — disponível
  - Amarelo — reservado
  - Vermelho — ocupado
  - Cinza — finalizado / sem atividade

## Observações
- A atualização de status é feita "on read" (ao listar), sem jobs persistentes. Suficiente para a prova.
- O projeto já contém um `.env` pronto para uso, com acesso **TEMPORÁRIO** ao meu MongoDB Atlas. O acesso dura 1 semana e é suficiente para esse exercício. Caso o acesso tenha sido revogado, me contate para subir um novo acesso. 
