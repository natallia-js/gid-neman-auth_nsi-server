use CentralConfigDB;
GO

/* Во всех таблицах должны быть поля createdAt, updatedAt !!! Типа 'DATETIMEOFFSET NOT NULL' */


/* Службы */
CREATE TABLE TServices
(
  S_ID int IDENTITY (1,1),
  S_Abbrev nvarchar(8) NOT NULL,
  S_Title nvarchar(32) NOT NULL,
  CONSTRAINT XPK_TServices PRIMARY KEY CLUSTERED (S_ID ASC),
  CONSTRAINT XUniqueServiceAbbrev UNIQUE (S_Abbrev)
)
go

/* Должности */
CREATE TABLE TPosts
(
  P_ID int IDENTITY (1,1),
  P_Abbrev nvarchar(8) NOT NULL,
  P_Title nvarchar(32) NOT NULL,
  CONSTRAINT XPK_TPosts PRIMARY KEY CLUSTERED (P_ID ASC),
  CONSTRAINT XUniquePostAbbrev UNIQUE (P_Abbrev)
)
go

/* Диспетчерские круги (участки ЭЦД) */
CREATE TABLE TECDSectors
(
  ECDS_ID int IDENTITY (1,1),
  ECDS_Title nvarchar(32) NOT NULL,
  CONSTRAINT XPK_TECDSectors PRIMARY KEY CLUSTERED (ECDS_ID ASC),
  CONSTRAINT XUniqueECDSectorTitle UNIQUE (ECDS_Title)
)
go

/* Диспетчерские участки (участки ДНЦ) */
CREATE TABLE TDNCSectors
(
  DNCS_ID int IDENTITY (1,1),
  DNCS_Title nvarchar(32) NOT NULL,
  CONSTRAINT XPK_TDNCSectors PRIMARY KEY CLUSTERED (DNCS_ID ASC),
  CONSTRAINT XUniqueDNCSectorTitle UNIQUE (DNCS_Title)
)
go

/* Диспетчерские участки (участки ДНЦ) и ближайшие к ним диспетчерские круги (участки ЭЦД) */
CREATE TABLE TNearestDNCandECDSectors
(
  NDE_ECDSectorID int NOT NULL,
  NDE_DNCSectorID int NOT NULL,
  CONSTRAINT XPK_TNearestDNCandECDSectors PRIMARY KEY CLUSTERED (NDE_ECDSectorID ASC, NDE_DNCSectorID ASC),
  CONSTRAINT XRef_TECDSectorFromNearest FOREIGN KEY (NDE_ECDSectorID) REFERENCES TECDSectors (ECDS_ID)
    ON DELETE NO ACTION
	  ON UPDATE NO ACTION,
  CONSTRAINT XRef_TDNCSectorFromNearest FOREIGN KEY (NDE_DNCSectorID) REFERENCES TDNCSectors (DNCS_ID)
    ON DELETE NO ACTION
	  ON UPDATE NO ACTION
)
go

/* Смежные диспетчерские круги (участки ЭЦД) */
CREATE TABLE TAdjacentECDSectors
(
  AECDS_ECDSectorID1 int NOT NULL,
  AECDS_ECDSectorID2 int NOT NULL,
  CONSTRAINT XPK_TAdjacentECDSectors PRIMARY KEY CLUSTERED (AECDS_ECDSectorID1 ASC, AECDS_ECDSectorID2 ASC),
  CONSTRAINT XRef_TECDSectorFromAdjacent1 FOREIGN KEY (AECDS_ECDSectorID1) REFERENCES TECDSectors (ECDS_ID)
    ON DELETE NO ACTION
	  ON UPDATE NO ACTION,
  CONSTRAINT XRef_TECDSectorFromAdjacent2 FOREIGN KEY (AECDS_ECDSectorID2) REFERENCES TECDSectors (ECDS_ID)
    ON DELETE NO ACTION
	  ON UPDATE NO ACTION
)
go

/* Смежные диспетчерские участки (участки ДНЦ) */
CREATE TABLE TAdjacentDNCSectors
(
  ADNCS_DNCSectorID1 int NOT NULL,
  ADNCS_DNCSectorID2 int NOT NULL,
  CONSTRAINT XPK_TAdjacentDNCSectors PRIMARY KEY CLUSTERED (ADNCS_DNCSectorID1 ASC, ADNCS_DNCSectorID2 ASC),
  CONSTRAINT XRef_TDNCSectorFromAdjacent1 FOREIGN KEY (ADNCS_DNCSectorID1) REFERENCES TDNCSectors (DNCS_ID)
    ON DELETE NO ACTION
	  ON UPDATE NO ACTION,
  CONSTRAINT XRef_TDNCSectorFromAdjacent2 FOREIGN KEY (ADNCS_DNCSectorID2) REFERENCES TDNCSectors (DNCS_ID)
    ON DELETE NO ACTION
	  ON UPDATE NO ACTION
)
go

/* Поездной участок ЭЦД */
CREATE TABLE TECDTrainSectors
(
  ECDTS_ID int IDENTITY (1,1),
  ECDTS_Title nvarchar(32) NOT NULL,
  ECDTS_ECDSectorID int NOT NULL,
  CONSTRAINT XPK_TECDTrainSectors PRIMARY KEY CLUSTERED (ECDTS_ID ASC),
  CONSTRAINT XUniqueECDTrainSectorTitle UNIQUE(ECDTS_Title),
  CONSTRAINT XRef_TECDSectorFromTrainSector FOREIGN KEY (ECDTS_ECDSectorID) REFERENCES TECDSectors (ECDS_ID)
    ON DELETE NO ACTION
	  ON UPDATE NO ACTION
)
go

/* Поездной участок ДНЦ */
CREATE TABLE TDNCTrainSectors
(
  DNCTS_ID int IDENTITY (1,1),
  DNCTS_Title nvarchar(32) NOT NULL,
  DNCTS_DNCSectorID int NOT NULL,
  CONSTRAINT XPK_TDNCTrainSectors PRIMARY KEY CLUSTERED (DNCTS_ID ASC),
  CONSTRAINT XUniqueDNCTrainSectorTitle UNIQUE(DNCTS_Title),
  CONSTRAINT XRef_TDNCSectorFromTrainSector FOREIGN KEY (DNCTS_DNCSectorID) REFERENCES TDNCSectors (DNCS_ID)
    ON DELETE NO ACTION
	  ON UPDATE NO ACTION
)
go

/* Структурные подразделения ЭЦД */
CREATE TABLE TECDStructuralDivisions
(
  ECDSD_ID int IDENTITY (1,1),
  ECDSD_Title nvarchar(32) NOT NULL,
  ECDSD_Post nvarchar(32),
  ECDSD_FIO nvarchar(32),
  ECDSD_ECDSectorID int NOT NULL,
  CONSTRAINT XPK_TECDStructuralDivisions PRIMARY KEY CLUSTERED (ECDSD_ID ASC),
  CONSTRAINT XRef_TECDSectorFromStructuralDivision FOREIGN KEY (ECDSD_ECDSectorID) REFERENCES TECDSectors (ECDS_ID)
    ON DELETE NO ACTION
	  ON UPDATE NO ACTION
)
go

/* Вносим изменения в таблицу станций */
ALTER TABLE TStations
ALTER COLUMN St_UNMC NVARCHAR(6) NOT NULL;
go

ALTER TABLE TStations
ADD CONSTRAINT XUniqueStationUNMC UNIQUE(St_UNMC);

ALTER TABLE TStations
ADD St_PENSI_ID int;

ALTER TABLE TStations
ADD St_PENSI_UNMC NVARCHAR(6);

/*
ALTER TABLE TStations
ADD createdAt DATETIMEOFFSET;
ALTER TABLE TStations
ADD updatedAt DATETIMEOFFSET;
go

UPDATE TStations
SET createdAt = GETDATE(), updatedAt = GETDATE();
go

ALTER TABLE TStations
ALTER COLUMN createdAt DATETIMEOFFSET NOT NULL;
ALTER TABLE TStations
ALTER COLUMN updatedAt DATETIMEOFFSET NOT NULL;
go
*/

/* Принадлежность станций поездным участкам ДНЦ и соответствующим участкам ДНЦ */
CREATE TABLE TDNCTrainSectorStations
(
  DNCTSS_TrainSectorID int NOT NULL,
  DNCTSS_StationID int NOT NULL,
  DNCTSS_StationPositionInTrainSector tinyint NOT NULL,
  DNCTSS_StationBelongsToDNCSector bit NOT NULL,
  CONSTRAINT XPK_TDNCTrainSectorStations PRIMARY KEY CLUSTERED (DNCTSS_TrainSectorID ASC, DNCTSS_StationID ASC),
  CONSTRAINT XUniqueStationPositionInDNCTrainSector UNIQUE (DNCTSS_TrainSectorID, DNCTSS_StationPositionInTrainSector),
  CONSTRAINT XRef_TDNCTrainSectorFromTSStations FOREIGN KEY (DNCTSS_TrainSectorID) REFERENCES TDNCTrainSectors (DNCTS_ID)
    ON DELETE NO ACTION
	  ON UPDATE NO ACTION,
  CONSTRAINT XRef_TStationFromDNCTrainSectorStations FOREIGN KEY (DNCTSS_StationID) REFERENCES TStations (St_ID)
    ON DELETE NO ACTION
	  ON UPDATE NO ACTION
)
go

/* Принадлежность станций поездным участкам ЭЦД и соответствующим участкам ЭЦД */
CREATE TABLE TECDTrainSectorStations
(
  ECDTSS_TrainSectorID int NOT NULL,
  ECDTSS_StationID int NOT NULL,
  ECDTSS_StationPositionInTrainSector tinyint NOT NULL,
  ECDTSS_StationBelongsToECDSector bit NOT NULL,
  CONSTRAINT XPK_TECDTrainSectorStations PRIMARY KEY CLUSTERED (ECDTSS_TrainSectorID ASC, ECDTSS_StationID ASC),
  CONSTRAINT XUniqueStationPositionInECDTrainSector UNIQUE (ECDTSS_TrainSectorID, ECDTSS_StationPositionInTrainSector),
  CONSTRAINT XRef_TECDTrainSectorFromTSStations FOREIGN KEY (ECDTSS_TrainSectorID) REFERENCES TECDTrainSectors (ECDTS_ID)
    ON DELETE NO ACTION
	  ON UPDATE NO ACTION,
  CONSTRAINT XRef_TStationFromECDTrainSectorStations FOREIGN KEY (ECDTSS_StationID) REFERENCES TStations (St_ID)
    ON DELETE NO ACTION
	  ON UPDATE NO ACTION
)
go

/* Перегоны межстанционные */
CREATE TABLE TBlocks
(
  Bl_ID int IDENTITY (1,1),
  Bl_Title nvarchar(64) NOT NULL,
  Bl_StationID1 int NOT NULL,
  Bl_StationID2 int NOT NULL,
  CONSTRAINT XPK_TBlocks PRIMARY KEY CLUSTERED (Bl_ID ASC),
  CONSTRAINT XRef_TStationFromBlock1 FOREIGN KEY (Bl_StationID1) REFERENCES TStations (St_ID)
    ON DELETE NO ACTION
	  ON UPDATE NO ACTION,
  CONSTRAINT XRef_TStationFromBlock2 FOREIGN KEY (Bl_StationID2) REFERENCES TStations (St_ID)
    ON DELETE NO ACTION
	  ON UPDATE NO ACTION,
  CONSTRAINT XUniqueBlockTitle UNIQUE (Bl_Title),
  CONSTRAINT XUniqueBlockStations UNIQUE (Bl_StationID1, Bl_StationID2)
)
go

/* Принадлежность перегонов поездным участкам ДНЦ и соответствующим участкам ДНЦ */
CREATE TABLE TDNCTrainSectorBlocks
(
  DNCTSB_TrainSectorID int NOT NULL,
  DNCTSB_BlockID int NOT NULL,
  DNCTSB_BlockPositionInTrainSector tinyint NOT NULL,
  DNCTSB_BlockBelongsToDNCSector bit NOT NULL,
  CONSTRAINT XPK_TDNCTrainSectorBlocks PRIMARY KEY CLUSTERED (DNCTSB_TrainSectorID ASC, DNCTSB_BlockID ASC),
  CONSTRAINT XUniqueBlockPositionInDNCTrainSector UNIQUE (DNCTSB_TrainSectorID, DNCTSB_BlockPositionInTrainSector),
  CONSTRAINT XRef_TDNCTrainSectorFromTSBlocks FOREIGN KEY (DNCTSB_TrainSectorID) REFERENCES TDNCTrainSectors (DNCTS_ID)
    ON DELETE NO ACTION
	  ON UPDATE NO ACTION,
  CONSTRAINT XRef_TBlockFromDNCTrainSectorBlocks FOREIGN KEY (DNCTSB_BlockID) REFERENCES TBlocks (Bl_ID)
    ON DELETE NO ACTION
	  ON UPDATE NO ACTION
)
go

/* Принадлежность перегонов поездным участкам ЭЦД и соответствующим участкам ЭЦД */
CREATE TABLE TECDTrainSectorBlocks
(
  ECDTSB_TrainSectorID int NOT NULL,
  ECDTSB_BlockID int NOT NULL,
  ECDTSB_BlockPositionInTrainSector tinyint NOT NULL,
  ECDTSB_BlockBelongsToECDSector bit NOT NULL,
  CONSTRAINT XPK_TECDTrainSectorBlocks PRIMARY KEY CLUSTERED (ECDTSB_TrainSectorID ASC, ECDTSB_BlockID ASC),
  CONSTRAINT XUniqueBlockPositionInECDTrainSector UNIQUE (ECDTSB_TrainSectorID, ECDTSB_BlockPositionInTrainSector),
  CONSTRAINT XRef_TECDTrainSectorFromTSBlocks FOREIGN KEY (ECDTSB_TrainSectorID) REFERENCES TECDTrainSectors (ECDTS_ID)
    ON DELETE NO ACTION
	  ON UPDATE NO ACTION,
  CONSTRAINT XRef_TBlockFromECDTrainSectorBlocks FOREIGN KEY (ECDTSB_BlockID) REFERENCES TBlocks (Bl_ID)
    ON DELETE NO ACTION
	  ON UPDATE NO ACTION
)
go

/* Рабочие полигоны-станции пользователей */
CREATE TABLE TStationWorkPoligons
(
  SWP_UserID varchar(24) NOT NULL,
  SWP_StID int NOT NULL,
  CONSTRAINT XPK_TStationWorkPoligons PRIMARY KEY CLUSTERED (SWP_UserID ASC, SWP_StID ASC),
  CONSTRAINT XRef_TStationFromWorkPoligon FOREIGN KEY (SWP_StID) REFERENCES TStations (St_ID)
    ON DELETE NO ACTION
	  ON UPDATE NO ACTION
)
go

/* Рабочие полигоны-участки ДНЦ пользователей */
CREATE TABLE TDNCSectorWorkPoligons
(
  DNCSWP_UserID varchar(24) NOT NULL,
  DNCSWP_DNCSID int NOT NULL,
  CONSTRAINT XPK_TDNCSectorWorkPoligons PRIMARY KEY CLUSTERED (DNCSWP_UserID ASC, DNCSWP_DNCSID ASC),
  CONSTRAINT XRef_TDNCSectorFromWorkPoligon FOREIGN KEY (DNCSWP_DNCSID) REFERENCES TDNCSectors (DNCS_ID)
    ON DELETE NO ACTION
	  ON UPDATE NO ACTION
)
go

/* Рабочие полигоны-участки ЭЦД пользователей */
CREATE TABLE TECDSectorWorkPoligons
(
  ECDSWP_UserID varchar(24) NOT NULL,
  ECDSWP_ECDSID int NOT NULL,
  CONSTRAINT XPK_TECDSectorWorkPoligons PRIMARY KEY CLUSTERED (ECDSWP_UserID ASC, ECDSWP_ECDSID ASC),
  CONSTRAINT XRef_TECDSectorFromWorkPoligon FOREIGN KEY (ECDSWP_ECDSID) REFERENCES TECDSectors (ECDS_ID)
    ON DELETE NO ACTION
	  ON UPDATE NO ACTION
)
go

/* Пути станций */
CREATE TABLE TStationTracks
(
  ST_ID int IDENTITY (1,1),
  ST_StationId int NOT NULL,
  ST_Name varchar(16) NOT NULL,
  CONSTRAINT XPK_TStationTracks PRIMARY KEY CLUSTERED (ST_ID ASC),
  CONSTRAINT XRef_TStationFromStationTrack FOREIGN KEY (ST_StationId) REFERENCES TStations (St_ID)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
)
go

/* Пути перегонов */
CREATE TABLE TBlockTracks
(
  BT_ID int IDENTITY (1,1),
  BT_BlockId int NOT NULL,
  BT_Name varchar(16) NOT NULL,
  CONSTRAINT XPK_TBlockTracks PRIMARY KEY CLUSTERED (BT_ID ASC),
  CONSTRAINT XRef_TBlockFromBlockTrack FOREIGN KEY (BT_BlockId) REFERENCES TBlocks (Bl_ID)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
)
go

/* Рабочие места на станциях */
CREATE TABLE TStationWorkPlaces
(
  SWP_ID int IDENTITY (1,1),
  SWP_StationId int NOT NULL,
  SWP_Name varchar(64) NOT NULL,
  CONSTRAINT XPK_TStationWorkPlaces PRIMARY KEY CLUSTERED (SWP_ID ASC),
  CONSTRAINT XRef_TStationFromStationWorkPlace FOREIGN KEY (SWP_StationId) REFERENCES TStations (St_ID)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
)
go


/* Расширяю понятие рабочего полигона-станции. Теперь это может быть не только сама
   станция, но и рабочее место, определенное в рамках данной станции */

/* После добавления данного поля автоматически меняется CONSTRAINT XPK_TStationWorkPoligons, менять его не нужно */
ALTER TABLE TStationWorkPoligons
ADD SWP_ID int IDENTITY (1,1);
go
ALTER TABLE TStationWorkPoligons
ADD SWP_StWP_ID int NULL;
go
ALTER TABLE TStationWorkPoligons
ADD CONSTRAINT XRef_TStationWorkPlaceFromWorkPoligon FOREIGN KEY (SWP_StWP_ID) REFERENCES TStationWorkPlaces (SWP_ID)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION;
go
ALTER TABLE TStationWorkPoligons
ADD CONSTRAINT XUniqueStationWorkPoligon UNIQUE (SWP_UserID, SWP_StID, SWP_StWP_ID);
