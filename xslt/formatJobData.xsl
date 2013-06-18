<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="xml" encoding="UTF-8" />

	<!-- 
		Transform has two main steps:

		The global variables organise the job data by pairing up matching
		payload and template fields, collecting payload fields with @query but
		no matching template field and iterating over subrecords to produce the required amount
		of repeating groups. 

		The root match template then filters out unnecessary fields and combines the template 
		and payload information	ready for interpretation by Rhinoforms/IM, as well as passing the existing 
		payload and job details through untouched.
	-->
	
	<xsl:variable name="payloadFields">
		<xsl:copy-of select="/merge/payload//data/record[1]/*"/>
	</xsl:variable>
	
	<xsl:variable name="mergedTemplateAndPayloadFields">
		<xsl:apply-templates select="/merge/ifl/fields/*">
			<xsl:with-param name="currentLevelPayloadFields" select="$payloadFields"/>
		</xsl:apply-templates>
	</xsl:variable>
	
	<xsl:variable name="unmatchedPayloadFields">
		<unmatchedFields>
			<xsl:apply-templates select="$payloadFields/field[@query] | $payloadFields/subrecord"/>
		</unmatchedFields>
	</xsl:variable>

	<xsl:template match="templateField">
		<xsl:param name="currentLevelPayloadFields"/>
		<xsl:variable name="name" select="name"/>
		<mergeField>
			<xsl:if test="parent::include">
				<xsl:attribute name="file" select="parent::include[1]/@file"/>
			</xsl:if>
			<template>
				<xsl:copy-of select="*"/>
			</template>
			<payload>
				<xsl:copy-of select="$currentLevelPayloadFields/field[@name=$name or ends-with(@name, concat('.', $name))]/@*"/>
				<xsl:value-of select="$currentLevelPayloadFields/field[@name=$name or ends-with(@name, concat('.', $name))]"/>
			</payload>
		</mergeField>
	</xsl:template>
	
	<xsl:template match="repeat">
		<xsl:param name="currentLevelPayloadFields"/>
		<xsl:variable name="subrecordName" select="@name"/>
		<xsl:variable name="repeatContents" select="*"/>
		<xsl:for-each select="$currentLevelPayloadFields/subrecord[@name=$subrecordName]">
			<xsl:variable name="subrecord" select="."/>
			<mergedSubrecord>
				<xsl:attribute name="name" select="$subrecordName"/>
				<xsl:attribute name="index" select="$subrecord/@index"/>
				<xsl:apply-templates select="$repeatContents">
					<xsl:with-param name="currentLevelPayloadFields" select="$subrecord"/>
				</xsl:apply-templates>
			</mergedSubrecord>
		</xsl:for-each>
	</xsl:template>
	
	<xsl:template match="field[@query and (parent::record or parent::subrecord)]">
		<xsl:param name="mergedFields" select="$mergedTemplateAndPayloadFields"/>
		<xsl:variable name="fieldName" select="@name"/>
		<xsl:if test="not($mergedFields/mergeField/payloadField[@name=$fieldName])">
			<mergeField>
				<template/>
				<payload>
					<xsl:copy-of select="@*"/>
					<xsl:value-of select="."/>
				</payload>
			</mergeField>
		</xsl:if>
	</xsl:template>
	
	<xsl:template match="subrecord">
		<xsl:variable name="name" select="@name"/>
		<xsl:variable name="index" select="@index"/>
		<unMatchedSubrecord>
			<xsl:attribute name="name" select="$name"/>
			<xsl:attribute name="index" select="$index"/>
			<xsl:apply-templates select="field[@query]">
				<xsl:with-param name="mergedFields" select="$mergedTemplateAndPayloadFields/subrecord[@name=$name and @index=$index]"/>
			</xsl:apply-templates>
		</unMatchedSubrecord>
	</xsl:template>

	<xsl:template match="/">
		<merge xmlns="">
			<xsl:copy-of select="/merge/jobId"/>
			<xsl:copy-of select="/merge/jobDetails"/>
			<interactive>
				<xsl:copy-of select="/merge/payload//template"/>
				<xsl:apply-templates select="/merge/payload//destinations"/>
				<data>
					<record>
						<xsl:apply-templates select="$mergedTemplateAndPayloadFields/*"/>
						<xsl:apply-templates select="$unmatchedPayloadFields/mergeField"/>
					</record>
				</data>
			</interactive>
			<xsl:copy-of select="/merge/payload"/>
		</merge>
	</xsl:template>
	
	<xsl:template match="field[not(@query)]"/>
	<xsl:template match="unMatchedSubrecord"/>

	<xsl:template match="destinations">
		<destinations>
			<xsl:for-each select="*">
				<destination>
					<xsl:attribute name="name">
						<xsl:value-of select="name()"/>
					</xsl:attribute>
					<xsl:for-each select="*">
						<xsl:element name="parameter">
							<xsl:attribute name="name">
								<xsl:value-of select="name()"/>
							</xsl:attribute>
							<xsl:value-of select="."/>
						</xsl:element>
					</xsl:for-each>
				</destination>
			</xsl:for-each>
		</destinations>
	</xsl:template>
	
	<xsl:template match="mergeField">
		<xsl:if test="template/query!='' or payload/@query!='' or (template/mandatory='true' and payload='')">
			<xsl:variable name="label">
				<xsl:choose>
					<xsl:when test="payload/@query">
						<xsl:value-of select="payload/@query"/>
					</xsl:when>
					<xsl:when test="template/query">
						<xsl:value-of select="template/query"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="template/name"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:variable>
			<xsl:variable name="type">
				<xsl:choose>
					<xsl:when test="template/type">
						<xsl:value-of select="substring-before(concat(template/type, '-'), '-')"/>
					</xsl:when>
					<xsl:when test="template/name = 'emailAddress' or payload/@name = 'emailAddress'">email</xsl:when>
					<xsl:otherwise>text</xsl:otherwise>
				</xsl:choose>
			</xsl:variable>
			<xsl:variable name="name">
				<xsl:choose>
					<xsl:when test="template/name">
						<xsl:value-of select="template/name"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="payload/@name"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:variable>
			<field>
				<xsl:attribute name="label"><xsl:value-of select="$label"/></xsl:attribute>
				<xsl:attribute name="type"><xsl:value-of select="$type"/></xsl:attribute>
				<xsl:attribute name="mandatory">
					<xsl:value-of select="template/mandatory = 'true'"/>
				</xsl:attribute>
				<xsl:attribute name="format">
					<xsl:value-of select="substring-after(template/type, '-')"/>
				</xsl:attribute>
				<xsl:attribute name="templateName">
					<xsl:value-of select="template/name"/>
				</xsl:attribute>
				<xsl:attribute name="payloadName">
					<xsl:value-of select="payload/@name"/>
				</xsl:attribute>
				<xsl:element name="{replace($name, '[:\.]', '-')}">
					<xsl:variable name="value">
						<xsl:choose>
							<xsl:when test="$type='file'"><xsl:value-of select="substring-after(template/type, '-')"/></xsl:when>
							<xsl:otherwise><xsl:value-of select="payload"/></xsl:otherwise>
						</xsl:choose>
					</xsl:variable>
					<xsl:call-template name="replace">
						<xsl:with-param name="string" select="$value"/>
						<xsl:with-param name="search" select='"&apos;"'/>
						<xsl:with-param name="replace" select='"\&apos;"'/>
					</xsl:call-template>
				</xsl:element>
			</field>
		</xsl:if>
	</xsl:template>
	
	<xsl:template match="mergedSubrecord">
		<xsl:variable name="name" select="@name"/>
		<xsl:variable name="index" select="@index"/>
		<subrecord>
			<xsl:attribute name="name" select="$name"/>
			<xsl:attribute name="index" select="$index"/>
			<xsl:apply-templates select="mergeField"/>
			<xsl:apply-templates select="$unmatchedPayloadFields//unMatchedSubrecord[@index=$index and @name=$name]"/>
		</subrecord>
	</xsl:template>

	<xsl:template name="replace">
		<xsl:param name="string"/>
		<xsl:param name="search"/>
		<xsl:param name="replace"/>
		<xsl:choose>
			<xsl:when test="contains($string, $search)">
				<xsl:value-of select="substring-before($string, $search)"/>
				<xsl:value-of select="$replace"/>
				<xsl:call-template name="replace">
					<xsl:with-param name="string" select="substring-after($string, $search)"/>
					<xsl:with-param name="search" select="$search"/>
					<xsl:with-param name="replace" select="$replace"/>
				</xsl:call-template>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$string"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
</xsl:stylesheet>