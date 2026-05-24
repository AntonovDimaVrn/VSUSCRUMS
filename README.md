
  # Data Analytics Platform UI

  This is a code bundle for Data Analytics Platform UI. The original project is available at https://www.figma.com/design/oYaEXDChdtMEgeLWA8aVw5/Data-Analytics-Platform-UI.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Backend bootstrap

  The repository now also includes a Python backend scaffold in [backend](./backend).

  1. Copy `backend/.env.example` to `backend/.env`
  2. Start PostgreSQL and the API:
     `docker compose up --build`
  3. Apply database migrations:
     `docker compose exec backend alembic upgrade head`
  4. Open the API docs:
     `http://localhost:8000/docs`
  5. Inspect the Excel import contract:
     `GET /api/v1/projects/import-template/spec`
  
